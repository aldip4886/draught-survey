/**
 * Pembaca GLB minimal untuk validator kontrak: nama node, jumlah segitiga, dan ukuran dunia (AABB).
 * Tidak memuat geometri; hanya membaca JSON glTF dan min/max accessor POSITION.
 * Batas: animasi, skin, dan morph target diabaikan; ukuran dihitung dari pose bind.
 */
export interface GlbInfo {
  nodeNames: Set<string>;
  triangleCount: number;
  /** Kotak batas dunia: [minX, minY, minZ, maxX, maxY, maxZ] (m, bila satuan glTF = meter). */
  bounds: [number, number, number, number, number, number];
}

interface GltfNode {
  name?: string;
  children?: number[];
  mesh?: number;
  matrix?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
}

interface Gltf {
  asset?: { version?: string };
  scene?: number;
  scenes?: { nodes?: number[] }[];
  nodes?: GltfNode[];
  meshes?: { primitives: { attributes: Record<string, number>; indices?: number; mode?: number }[] }[];
  accessors?: { count: number; min?: number[]; max?: number[] }[];
}

type Mat4 = number[]; // kolom-mayor, seperti glTF

const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r]! += a[k * 4 + r]! * b[c * 4 + k]!;
  return o;
}

function trs(n: GltfNode): Mat4 {
  if (n.matrix) return n.matrix;
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  const x2 = qx! + qx!, y2 = qy! + qy!, z2 = qz! + qz!;
  const xx = qx! * x2, xy = qx! * y2, xz = qx! * z2, yy = qy! * y2, yz = qy! * z2, zz = qz! * z2;
  const wx = qw! * x2, wy = qw! * y2, wz = qw! * z2;
  return [
    (1 - (yy + zz)) * sx!, (xy + wz) * sx!, (xz - wy) * sx!, 0,
    (xy - wz) * sy!, (1 - (xx + zz)) * sy!, (yz + wx) * sy!, 0,
    (xz + wy) * sz!, (yz - wx) * sz!, (1 - (xx + yy)) * sz!, 0,
    tx!, ty!, tz!, 1,
  ];
}

function transformPoint(m: Mat4, p: [number, number, number]): [number, number, number] {
  return [
    m[0]! * p[0] + m[4]! * p[1] + m[8]! * p[2] + m[12]!,
    m[1]! * p[0] + m[5]! * p[1] + m[9]! * p[2] + m[13]!,
    m[2]! * p[0] + m[6]! * p[1] + m[10]! * p[2] + m[14]!,
  ];
}

export function inspectGlb(bytes: Uint8Array): GlbInfo {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67) throw new Error("bukan berkas GLB (magic salah)");
  if (dv.getUint32(4, true) !== 2) throw new Error("GLB harus versi 2");
  const jsonLen = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== 0x4e4f534a) throw new Error("chunk pertama GLB bukan JSON");
  const gltf = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLen))) as Gltf;

  const nodes = gltf.nodes ?? [];
  const nodeNames = new Set(nodes.map((n) => n.name).filter((n): n is string => !!n));
  const roots = gltf.scenes?.[gltf.scene ?? 0]?.nodes ?? nodes.map((_, i) => i);

  let triangleCount = 0;
  let min: [number, number, number] = [Infinity, Infinity, Infinity];
  let max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  const acc = gltf.accessors ?? [];

  const walk = (idx: number, parent: Mat4): void => {
    const n = nodes[idx];
    if (!n) return;
    const world = mul(parent, trs(n));
    if (n.mesh !== undefined) {
      for (const prim of gltf.meshes?.[n.mesh]?.primitives ?? []) {
        const mode = prim.mode ?? 4;
        if (mode === 4) {
          const count = prim.indices !== undefined ? acc[prim.indices]?.count : acc[prim.attributes["POSITION"]!]?.count;
          triangleCount += Math.floor((count ?? 0) / 3);
        }
        const pos = acc[prim.attributes["POSITION"]!];
        if (pos?.min && pos.max) {
          for (const cx of [pos.min[0]!, pos.max[0]!])
            for (const cy of [pos.min[1]!, pos.max[1]!])
              for (const cz of [pos.min[2]!, pos.max[2]!]) {
                const w = transformPoint(world, [cx, cy, cz]);
                for (let a = 0; a < 3; a++) {
                  min[a] = Math.min(min[a]!, w[a]!);
                  max[a] = Math.max(max[a]!, w[a]!);
                }
              }
        }
      }
    }
    for (const c of n.children ?? []) walk(c, world);
  };
  for (const r of roots) walk(r, IDENTITY);

  if (!isFinite(min[0])) {
    min = [0, 0, 0];
    max = [0, 0, 0];
  }
  return { nodeNames, triangleCount, bounds: [...min, ...max] };
}
