/** Membuat GLB sintetis (JSON saja, tanpa data biner) untuk menguji validator dan loader. */
export interface BuildOptions {
  /** Ukuran kotak [x, y, z] dalam satuan model. */
  extent: [number, number, number];
  /** Sisi bawah model di y = 0 (baseline) bila true; selain itu terpusat di y. */
  baseline?: boolean;
  triangles?: number;
  anchors?: string[];
  /** Skala node akar (mis. 100 untuk model yang diekspor dalam cm lalu diskalakan). */
  rootScale?: number;
}

export function buildGlb(o: BuildOptions): Uint8Array {
  const [ex, ey, ez] = o.extent;
  const baseline = o.baseline ?? true;
  const yMin = baseline ? 0 : -ey / 2;
  const nodes: object[] = [
    { name: "body", mesh: 0 },
    ...(o.anchors ?? []).map((name) => ({ name, translation: [0, 1, 0] })),
  ];
  const root = {
    name: "root",
    children: nodes.map((_, i) => i + 1),
    ...(o.rootScale ? { scale: [o.rootScale, o.rootScale, o.rootScale] } : {}),
  };
  const gltf = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [root, ...nodes],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    accessors: [
      { count: 24, componentType: 5126, type: "VEC3", min: [-ex / 2, yMin, -ez / 2], max: [ex / 2, yMin + ey, ez / 2] },
      { count: (o.triangles ?? 12) * 3, componentType: 5123, type: "SCALAR" },
    ],
  };
  let json = JSON.stringify(gltf);
  while (json.length % 4 !== 0) json += " ";
  const jsonBytes = new TextEncoder().encode(json);
  const total = 12 + 8 + jsonBytes.length;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonBytes.length, true);
  dv.setUint32(16, 0x4e4f534a, true);
  out.set(jsonBytes, 20);
  return out;
}
