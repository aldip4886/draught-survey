import { describe, expect, it } from "vitest";
import { formatAngka, formatTanggal, parseAngka } from "@/lib/angka";

describe("formatAngka", () => {
  it("memakai koma desimal dan titik ribuan", () => {
    expect(formatAngka(31573.3)).toBe("31.573,30");
    expect(formatAngka(1.018, 3)).toBe("1,018");
  });
});

describe("formatTanggal", () => {
  it("memakai nama bulan Indonesia", () => {
    expect(formatTanggal(new Date(2026, 10, 20))).toBe("20 November 2026");
  });
});

describe("parseAngka", () => {
  it.each([
    ["10,12", 10.12],
    ["10.12", 10.12],
    ["1.018", 1.018],
    ["31.573,30", 31573.3],
    ["1.234.567", 1234567],
    ["-0,5", -0.5],
    ["−0,5", -0.5],
    [" 41441,72 ", 41441.72],
  ])("%s → %d", (raw, expected) => {
    expect(parseAngka(raw)).toBe(expected);
  });

  it.each(["", "abc", "1,2,3", "12.34.5", "3.1.5,0", "1,"])("%s tidak terbaca", (raw) => {
    expect(parseAngka(raw)).toBeNull();
  });
});
