import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  anchor,
  checkManifest,
  createAssetLoader,
  draughtMarkPlacements,
  inspectGlb,
  numeralLayout,
  validateAssets,
  type AssetManifest,
  type LoadedModel,
} from "../src";
import { buildGlb } from "./glb-builder";

const repoManifest = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../content/assets/manifest.json"), "utf8"),
);

/** Manifest uji: satu model perahu dengan file terisi. */
function manifestWithBoat(file: string | null): AssetManifest {
  const m = structuredClone(repoManifest) as AssetManifest;
  m.models["survey-boat"]!.file = file;
  return m;
}

const boatAnchors = ["anchor_viewer_seat", "anchor_sampler_mount"];
const goodBoat = () => buildGlb({ extent: [2, 1.5, 6], anchors: boatAnchors, triangles: 500 });
const files = (map: Record<string, Uint8Array>) => (p: string) => {
  const f = map[p];
  if (!f) throw new Error("berkas tidak ada");
  return f;
};

describe("manifest di repo", () => {
  it("lolos kontrak (semua aset bawaan, lisensi terisi)", () => {
    expect(validateAssets(repoManifest, () => new Uint8Array())).toEqual([]);
  });

  it("lisensi kosong gagal", () => {
    const m = structuredClone(repoManifest);
    m.textures.sky.license = "  ";
    expect(checkManifest(m).issues).toEqual([{ asset: "textures/sky", message: "lisensi kosong" }]);
  });

  it("bentuk manifest salah gagal", () => {
    expect(checkManifest({ version: 2 }).issues.length).toBeGreaterThan(0);
  });
});

describe("validator model GLB", () => {
  const run = (glb: Uint8Array) =>
    validateAssets(manifestWithBoat("models/boat.glb"), files({ "models/boat.glb": glb })).map((i) => i.message);

  it("GLB yang memenuhi kontrak lolos", () => {
    expect(run(goodBoat())).toEqual([]);
  });

  it("jangkar wajib hilang gagal", () => {
    const msgs = run(buildGlb({ extent: [2, 1.5, 6], anchors: ["anchor_viewer_seat"], triangles: 500 }));
    expect(msgs).toEqual(["jangkar wajib hilang: anchor_sampler_mount"]);
  });

  it("anggaran poligon terlampaui gagal", () => {
    const msgs = run(buildGlb({ extent: [2, 1.5, 6], anchors: boatAnchors, triangles: 9000 }));
    expect(msgs.join()).toMatch(/anggaran poligon terlampaui: 9000 segitiga > 8000/);
  });

  it("satuan salah (model dalam cm) gagal", () => {
    const msgs = run(buildGlb({ extent: [200, 150, 600], anchors: boatAnchors }));
    expect(msgs.join()).toMatch(/satuan harus meter/);
  });

  it("skala akar yang menebus satuan diperhitungkan (cm × 0,01 lolos)", () => {
    expect(run(buildGlb({ extent: [200, 150, 600], anchors: boatAnchors, rootScale: 0.01 }))).toEqual([]);
  });

  it("orientasi salah (panjang di sumbu X) gagal", () => {
    const msgs = run(buildGlb({ extent: [6, 1.5, 2], anchors: boatAnchors }));
    expect(msgs.join()).toMatch(/orientasi salah: sisi terpanjang di sumbu x, seharusnya z/);
  });

  it("origin lambung bukan di baseline gagal", () => {
    const m = manifestWithBoat(null);
    m.models["ship-hull"]!.file = "models/hull.glb";
    const hull = buildGlb({
      extent: [30, 18, 190],
      baseline: false,
      anchors: ["anchor_deck_center", "anchor_waterline_ref"],
      triangles: 1000,
    });
    const msgs = validateAssets(m, files({ "models/hull.glb": hull })).map((i) => i.message);
    expect(msgs.join()).toMatch(/origin bukan di baseline/);
  });

  it("berkas bukan GLB atau hilang dilaporkan, bukan melempar", () => {
    const m = manifestWithBoat("models/boat.glb");
    expect(validateAssets(m, files({ "models/boat.glb": new Uint8Array(40) }))[0]!.message).toMatch(/tidak terbaca/);
    expect(validateAssets(m, files({}))[0]!.message).toMatch(/tidak terbaca/);
  });
});

/** Loader uji: membaca GLB sungguhan lewat inspectGlb; handle hanya penanda sumber. */
function makeLoader(manifest: AssetManifest, store: Record<string, Uint8Array>, warn = vi.fn()) {
  const builtin = (role: string): LoadedModel<string> => ({
    handle: `builtin:${role}`,
    anchors: Object.fromEntries((manifest.models[role]?.anchors ?? []).map((a) => [a, [0, 0, 0]])),
  });
  const loadModel = async (file: string): Promise<LoadedModel<string>> => {
    const bytes = store[file];
    if (!bytes) throw new Error("404");
    const info = inspectGlb(bytes);
    return { handle: `file:${file}`, anchors: Object.fromEntries([...info.nodeNames].map((n) => [n, [0, 1, 0]])) };
  };
  return { loader: createAssetLoader({ manifest, builtin, loadModel, warn }), warn };
}

describe("loader aset", () => {
  it("entri dengan file kosong memakai aset bawaan, tanpa peringatan", async () => {
    const { loader, warn } = makeLoader(manifestWithBoat(null), {});
    expect((await loader.model("survey-boat")).handle).toBe("builtin:survey-boat");
    expect(warn).not.toHaveBeenCalled();
  });

  it("berkas gagal dimuat: aset bawaan dan peringatan, sesi tidak jatuh", async () => {
    const { loader, warn } = makeLoader(manifestWithBoat("models/hilang.glb"), {});
    expect((await loader.model("survey-boat")).handle).toBe("builtin:survey-boat");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toMatch(/gagal memuat models\/hilang.glb/);
  });

  it("jangkar wajib hilang di runtime: aset bawaan dan peringatan", async () => {
    const bad = buildGlb({ extent: [2, 1.5, 6], anchors: ["anchor_viewer_seat"] });
    const { loader, warn } = makeLoader(manifestWithBoat("models/boat.glb"), { "models/boat.glb": bad });
    expect((await loader.model("survey-boat")).handle).toBe("builtin:survey-boat");
    expect(warn.mock.calls[0]![0]).toMatch(/jangkar hilang \(anchor_sampler_mount\)/);
  });

  it("peran yang tidak ada di manifest ditolak", async () => {
    const { loader } = makeLoader(manifestWithBoat(null), {});
    await expect(loader.model("tidak-ada")).rejects.toThrow(/tidak ada di manifest/);
  });

  it("mengganti satu aset dengan GLB lain yang memenuhi kontrak berjalan tanpa mengubah kode", async () => {
    const replacement = goodBoat();
    // 1) validator menerimanya
    const manifest = manifestWithBoat("models/perahu-lain.glb");
    expect(validateAssets(manifest, files({ "models/perahu-lain.glb": replacement }))).toEqual([]);
    // 2) loader yang sama (kode tak berubah) memakainya; aset lain tetap bawaan
    const { loader, warn } = makeLoader(manifest, { "models/perahu-lain.glb": replacement });
    const boat = await loader.model("survey-boat");
    expect(boat.handle).toBe("file:models/perahu-lain.glb");
    expect(anchor(boat, "anchor_viewer_seat")).toEqual([0, 1, 0]);
    expect((await loader.model("hydrometer")).handle).toBe("builtin:hydrometer");
    expect(warn).not.toHaveBeenCalled();
  });

  it("anchor() menolak nama yang tidak ada", () => {
    expect(() => anchor({ handle: null, anchors: {} }, "anchor_x")).toThrow(/jangkar tidak ada/);
  });
});

describe("tanda sarat digambar dari data", () => {
  it("angka tiap 0,2 m dengan sisi bawah tepat di nilai sarat dari baseline", () => {
    const n = numeralLayout({ from: 10.0, to: 10.7 });
    expect(n.map((x) => x.value)).toEqual([10, 10.2, 10.4, 10.6]);
    expect(n[1]).toEqual({ value: 10.2, bottomY: 10.2, topY: 10.3 });
  });

  it("ketinggian tidak bergantung pada model: skala angka hanya mengubah tinggi angka", () => {
    const n = numeralLayout({ from: 10, to: 10.5, numeralHeight: 0.3 });
    expect(n[0]).toEqual({ value: 10, bottomY: 10, topY: 10.3 });
  });

  it("enam pelat di posisi dari FP, AP, dan midship", () => {
    const p = draughtMarkPlacements(
      { lbp: 180, forwardAftOfFp: 3, aftForwardOfAp: 6, midAftOfMidship: 0.5, halfBeam: 15 },
      { from: 10, to: 11 },
    );
    expect(p).toHaveLength(6);
    expect(p.find((m) => m.position === "forward" && m.side === "starboard")).toMatchObject({ x: 87, z: 15 });
    expect(p.find((m) => m.position === "aft" && m.side === "port")).toMatchObject({ x: -84, z: -15 });
  });
});
