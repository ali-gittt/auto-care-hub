import { describe, it, expect } from "vitest";
import {
  computeDerivedFeatures,
  predictDtc,
  DEFAULT_TELEMETRY,
  DIAGNOSTIC_PRESETS,
  type RawTelemetryFeatures,
} from "./dtc-scanner";
import { navFor } from "./roles";

describe("dtc_scanner_final model & feature dependencies", () => {
  it("accurately computes the 5 derived features that the model depends on", () => {
    const sample: RawTelemetryFeatures = {
      ...DEFAULT_TELEMETRY,
      accel_d: 40.0,
      accel_e: 25.0,
      throttle: 60.0,
      rel_throttle: 20.0,
      load: 80.0,
      speed: 40.0,
    };

    const derived = computeDerivedFeatures(sample);

    // pedal_diff = D - E = 40 - 25 = 15
    expect(derived.pedal_diff).toBe(15.0);
    // abs_pedal_diff = |15| = 15
    expect(derived.abs_pedal_diff).toBe(15.0);
    // throttle_gap = throttle - rel_throttle = 60 - 20 = 40
    expect(derived.throttle_gap).toBe(40.0);
    // abs_throttle_gap = |40| = 40
    expect(derived.abs_throttle_gap).toBe(40.0);
    // load_per_speed = 80 / 40 = 2.0
    expect(derived.load_per_speed).toBe(2.0);
  });

  it("handles stationary vehicle (speed = 0) safely in load_per_speed", () => {
    const sample: RawTelemetryFeatures = {
      ...DEFAULT_TELEMETRY,
      speed: 0,
      load: 30,
    };
    const derived = computeDerivedFeatures(sample);
    expect(derived.load_per_speed).toBe(0);
  });

  it("predicts NORMAL state with high confidence for baseline telemetry", () => {
    const res = predictDtc(DEFAULT_TELEMETRY);
    expect(res.predictedClass).toBe("NORMAL");
    expect(res.confidence).toBeGreaterThan(95);
    expect(res.probabilities.find((p) => p.className === "NORMAL")?.isPredicted).toBe(true);
  });

  it("predicts P0120 when throttle and pedal track mismatch occurs", () => {
    const p0120Preset = DIAGNOSTIC_PRESETS.find((p) => p.targetClass === "P0120");
    expect(p0120Preset).toBeDefined();
    if (p0120Preset) {
      const res = predictDtc(p0120Preset.telemetry);
      expect(res.predictedClass).toBe("P0120");
      expect(res.confidence).toBeGreaterThan(90);
    }
  });

  it("predicts P0171 under lean airflow condition", () => {
    const p0171Preset = DIAGNOSTIC_PRESETS.find((p) => p.targetClass === "P0171");
    expect(p0171Preset).toBeDefined();
    if (p0171Preset) {
      const res = predictDtc(p0171Preset.telemetry);
      expect(res.predictedClass).toBe("P0171");
      expect(res.confidence).toBeGreaterThan(90);
    }
  });

  it("predicts P0300 under cylinder misfire pattern", () => {
    const p0300Preset = DIAGNOSTIC_PRESETS.find((p) => p.targetClass === "P0300");
    expect(p0300Preset).toBeDefined();
    if (p0300Preset) {
      const res = predictDtc(p0300Preset.telemetry);
      expect(res.predictedClass).toBe("P0300");
      expect(res.confidence).toBeGreaterThan(90);
    }
  });
});

describe("navigation role security rules", () => {
  it("DTC Scanner appears on mechanic (worker) navigation bar", () => {
    const workerNav = navFor("worker");
    const dtcItem = workerNav.find((item) => item.to === "/dtc-scanner");
    expect(dtcItem).toBeDefined();
    expect(dtcItem?.label).toBe("DTC Scanner");
  });

  it("DTC Scanner appears on admin navigation bar", () => {
    const adminNav = navFor("admin");
    const dtcItem = adminNav.find((item) => item.to === "/dtc-scanner");
    expect(dtcItem).toBeDefined();
    expect(dtcItem?.label).toBe("DTC Scanner");
  });

  it("DTC Scanner NEVER appears on customer navigation bar", () => {
    const customerNav = navFor("customer");
    const dtcItem = customerNav.find((item) => item.to === "/dtc-scanner");
    expect(dtcItem).toBeUndefined();
  });
});
