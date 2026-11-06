import { describe, expect, it } from "vitest";
import { parsePercentage } from "@/flags/flags";
import { buildFlags } from "../prisma/seed";

describe("seed", () => {
  const flags = buildFlags();
  it("has 12 flags, each key in staging and prod", () => {
    expect(flags).toHaveLength(12);
    expect(new Set(flags.map((f) => `${f.key}:${f.env}`)).size).toBe(12);
    expect(flags.filter((f) => f.env === "prod")).toHaveLength(6);
  });
  it("percentage is set only (and validly) in the percentage state", () => {
    for (const f of flags) {
      expect(f.percentage != null).toBe(f.state === "percentage");
      if (f.percentage != null) expect(parsePercentage(f.percentage)).toBe(f.percentage);
    }
  });
});

describe("parsePercentage", () => {
  it.each([[25, 25], ["40", 40], [0, null], [100, null], [12.5, null], ["", null], [null, null]])("%s -> %s", (v, out) => {
    expect(parsePercentage(v)).toBe(out);
  });
});
