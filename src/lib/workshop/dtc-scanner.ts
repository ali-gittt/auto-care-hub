import modelData from "./dtc-model.json";

export type DtcClass = "NORMAL" | "P0115" | "P0120" | "P0171" | "P0300";

export interface RawTelemetryFeatures {
  baro: number; // Barometric Pressure (kPa)
  demand_torque: number; // Divers Demand Engine Percent Torque (%)
  rel_throttle: number; // Relative Throttle Position (%)
  accel_e: number; // Accelerator Pedal Position E (%)
  consumption: number; // Consumption Rate (L/h)
  load: number; // Engine Load (%)
  maf: number; // Mass Air Flow (g/s)
  speed: number; // Vehicle Speed (km/h)
  ambient_temp: number; // Ambient Air Temperature (°C)
  rpm: number; // Engine RPM (rev/min)
  actual_torque: number; // Actual Engine Percent Torque (%)
  fuel_level: number; // Fuel Level (%)
  accel_d: number; // Accelerator Pedal Position D (%)
  throttle: number; // Throttle Position (%)
}

export interface DerivedFeatures {
  pedal_diff: number; // Accelerator Pedal Position D - E
  throttle_gap: number; // Throttle Position - Relative Throttle Position
  abs_pedal_diff: number; // |pedal_diff|
  abs_throttle_gap: number; // |throttle_gap|
  load_per_speed: number; // Load / (Speed > 0 ? Speed : 1)
}

export interface DtcCodeInfo {
  code: DtcClass;
  title: string;
  subsystem: string;
  severity: "nominal" | "warning" | "critical" | "severe";
  description: string;
  symptoms: string[];
  causes: string[];
  mechanicActions: string[];
}

export const DTC_CODE_REGISTRY: Record<DtcClass, DtcCodeInfo> = {
  NORMAL: {
    code: "NORMAL",
    title: "All Powertrain Systems Nominal",
    subsystem: "Engine Management & Telemetry",
    severity: "nominal",
    description: "No diagnostic trouble codes detected. Telemetry streams indicate air/fuel mixture, throttle response, and cylinder combustion are operating within factory thresholds.",
    symptoms: ["Smooth idling and progressive acceleration", "Nominal fuel economy and emissions", "No active Malfunction Indicator Lamp (MIL/CEL)"],
    causes: ["Vehicle sensors operating within calibrated manufacturer tolerances"],
    mechanicActions: [
      "Record baseline telemetry in workshop service log.",
      "Proceed with routine scheduled maintenance inspection.",
    ],
  },
  P0115: {
    code: "P0115",
    title: "Engine Coolant Temperature (ECT) Circuit Malfunction",
    subsystem: "Cooling & Thermal Management",
    severity: "warning",
    description: "The engine control module (ECM) detected an erratic, open, or shorted voltage signal from the primary Engine Coolant Temperature sensor or ambient correlation fault.",
    symptoms: [
      "Check Engine Light (MIL) illuminated",
      "Radiator cooling fans running constantly at high speed",
      "Rough cold engine start or excessive fuel consumption due to improper closed-loop enrichment",
    ],
    causes: [
      "Faulty Engine Coolant Temperature (ECT) sensor element",
      "Corroded, loose, or severed wiring harness / connector pins",
      "Stuck open engine cooling thermostat preventing normal warm-up",
      "Low coolant fluid level or air pocket near temperature probe",
    ],
    mechanicActions: [
      "Probe ECT sensor harness with multimeter for reference 5.0V and ground continuity.",
      "Measure sensor resistance against manufacturer thermal curve (cold vs warm).",
      "Check engine coolant level and inspect thermostat housing for leakage.",
      "Clear stored freeze frame DTC and perform drive cycle warm-up verification.",
    ],
  },
  P0120: {
    code: "P0120",
    title: "Throttle / Pedal Position Sensor / Switch 'A' Circuit Malfunction",
    subsystem: "Drive-By-Wire Throttle Control",
    severity: "critical",
    description: "A correlation failure or circuit anomaly was detected between the throttle position sensor (TPS) tracks and accelerator pedal position sensors (Tracks D and E).",
    symptoms: [
      "Vehicle forced into Engine Failsafe / Limp-Home Mode",
      "Hesitation, dead spots, or lack of response upon accelerator pedal depression",
      "Abrupt engine surging or unstable idle speed",
    ],
    causes: [
      "Worn potentiometer wiper tracks inside Throttle Position Sensor or Accelerator Pedal assembly",
      "Carbon / soot buildup inside electronic throttle body bore restricting plate movement",
      "Loose pin fitment or intermittent ground drop in TPS 6-pin harness",
      "Faulty drive-by-wire servo motor inside electronic throttle body",
    ],
    mechanicActions: [
      "Inspect dual pedal sensors (D & E) signal sweep on oscilloscope for voltage dropouts.",
      "Clean throttle body bore and butterfly valve with approved cleaner.",
      "Check 5V reference supply and ground drop under mechanical vibration.",
      "Perform throttle position sensor relearn / calibration procedure via diagnostic tool.",
    ],
  },
  P0171: {
    code: "P0171",
    title: "Fuel Trim System Too Lean (Bank 1)",
    subsystem: "Air/Fuel Metering & Induction",
    severity: "warning",
    description: "The engine control module is commanding maximum positive fuel trim compensation because the air/fuel ratio is excessively lean (too much air or insufficient fuel).",
    symptoms: [
      "Check Engine Light steady illumination",
      "Engine hesitation, bucking, or flat spots under acceleration",
      "Rough or hunting idle, potential mild misfires when cold",
      "Whistling or hissing noise from vacuum hoses under load",
    ],
    causes: [
      "Unmetered vacuum leak downstream of the Mass Air Flow (MAF) sensor",
      "Contaminated or oil-soaked hot-wire Mass Air Flow (MAF) sensor",
      "Weak fuel pump, clogged fuel filter, or partially restricted fuel injectors",
      "Defective PCV (Positive Crankcase Ventilation) valve diaphragm or hose",
    ],
    mechanicActions: [
      "Perform smoke test on intake manifold, vacuum lines, and intake boot to locate leaks.",
      "Inspect and clean MAF sensor element using dedicated non-residue MAF cleaner.",
      "Verify fuel rail pressure against manufacturer specifications under load.",
      "Check short-term and long-term fuel trim values (STFT & LTFT) during live road test.",
    ],
  },
  P0300: {
    code: "P0300",
    title: "Random / Multiple Cylinder Misfire Detected",
    subsystem: "Ignition & Combustion Integrity",
    severity: "severe",
    description: "The crankshaft position sensor detected instantaneous rotational deceleration indicating that one or multiple cylinders failed to combust fuel properly.",
    symptoms: [
      "Flashing Check Engine Light (flashing indicates potential catalytic converter damage)",
      "Severe vehicle shaking, shuddering, and pronounced power loss",
      "Strong unburnt fuel or sulfur odor from exhaust tailpipe",
      "Difficulty maintaining engine idle speed without stalling",
    ],
    causes: [
      "Worn spark plugs, excessive electrode gap, or fouled spark plug tips",
      "Failing ignition coil packs or cracked spark plug boot insulation",
      "Substantial vacuum leak affecting multi-cylinder intake runners",
      "Low fuel rail pressure or uneven injector spray patterns",
      "Internal mechanical issue (valve leakage, low cylinder compression)",
    ],
    mechanicActions: [
      "DO NOT operate under heavy load if MIL is flashing to prevent catalytic converter melt.",
      "Inspect spark plugs and ignition coils for carbon tracking or oil fouling.",
      "Monitor individual cylinder misfire counters (Cyl 1-4/6/8) on live diagnostic stream.",
      "Perform cylinder relative compression test and verify fuel delivery volume.",
    ],
  },
};

export const DEFAULT_TELEMETRY: RawTelemetryFeatures = {
  baro: 99.0,
  demand_torque: 25.0,
  rel_throttle: 18.0,
  accel_e: 22.0,
  consumption: 4.5,
  load: 35.0,
  maf: 14.5,
  speed: 55.0,
  ambient_temp: 32.0,
  rpm: 1850.0,
  actual_torque: 26.0,
  fuel_level: 92.0,
  accel_d: 22.5,
  throttle: 20.0,
};

export interface DiagnosticPreset {
  id: string;
  name: string;
  targetClass: DtcClass;
  subtitle: string;
  description: string;
  telemetry: RawTelemetryFeatures;
}

export const DIAGNOSTIC_PRESETS: DiagnosticPreset[] = [
  {
    id: "preset-normal",
    name: "Standard Highway Cruise",
    targetClass: "NORMAL",
    subtitle: "Nominal Baseline State",
    description: "Normal cruise at 55 km/h, well-balanced throttle, optimal air/fuel ratio, zero pedal divergence.",
    telemetry: {
      baro: 99.0,
      demand_torque: 25.0,
      rel_throttle: 18.0,
      accel_e: 22.0,
      consumption: 4.5,
      load: 35.0,
      maf: 14.5,
      speed: 55.0,
      ambient_temp: 32.0,
      rpm: 1850.0,
      actual_torque: 26.0,
      fuel_level: 92.0,
      accel_d: 22.5,
      throttle: 20.0,
    },
  },
  {
    id: "preset-p0115",
    name: "ECT Sensor Circuit Failure",
    targetClass: "P0115",
    subtitle: "Thermal & Sensor Glitch",
    description: "Coolant temperature circuit drop with erratic low temperature reading under driving load.",
    telemetry: {
      baro: 99.0,
      demand_torque: 20.0,
      rel_throttle: 15.0,
      accel_e: 18.0,
      consumption: 2.0,
      load: 25.0,
      maf: 8.0,
      speed: 40.0,
      ambient_temp: 28.5,
      rpm: 1200.0,
      actual_torque: 20.0,
      fuel_level: 90.0,
      accel_d: 18.0,
      throttle: 18.0,
    },
  },
  {
    id: "preset-p0120",
    name: "TPS / Pedal Track Mismatch",
    targetClass: "P0120",
    subtitle: "Drive-By-Wire Correlation Error",
    description: "Severe divergence between Throttle Position and Relative Throttle with asymmetric pedal track sensor readings.",
    telemetry: {
      baro: 99.0,
      demand_torque: 60.0,
      rel_throttle: 85.0,
      accel_e: 20.0,
      consumption: 8.0,
      load: 75.0,
      maf: 25.0,
      speed: 65.0,
      ambient_temp: 33.0,
      rpm: 2200.0,
      actual_torque: 45.0,
      fuel_level: 88.0,
      accel_d: 55.0,
      throttle: 22.0,
    },
  },
  {
    id: "preset-p0171",
    name: "System Too Lean (Bank 1)",
    targetClass: "P0171",
    subtitle: "Unmetered Air / Vacuum Leak",
    description: "Abnormally low Mass Air Flow reading under elevated engine load, characteristic of an intake vacuum leak.",
    telemetry: {
      baro: 99.04,
      demand_torque: 12.08,
      rel_throttle: 23.84,
      accel_e: 46.72,
      consumption: 22.11,
      load: 94.47,
      maf: 6.0,
      speed: 53.47,
      ambient_temp: 30.44,
      rpm: 1395.0,
      actual_torque: 20.59,
      fuel_level: 91.0,
      accel_d: 27.0,
      throttle: 31.34,
    },
  },
  {
    id: "preset-p0300",
    name: "Multi-Cylinder Combustion Misfire",
    targetClass: "P0300",
    subtitle: "Ignition / Compression Failure",
    description: "Disproportionate high engine load at low vehicle speed with severe combustion fluctuation signature.",
    telemetry: {
      baro: 98.92,
      demand_torque: 45.69,
      rel_throttle: 55.62,
      accel_e: 69.14,
      consumption: 3.97,
      load: 89.85,
      maf: 23.32,
      speed: 12.39,
      ambient_temp: 34.08,
      rpm: 1740.0,
      actual_torque: 32.52,
      fuel_level: 94.99,
      accel_d: 53.08,
      throttle: 65.94,
    },
  },
];

export function computeDerivedFeatures(raw: RawTelemetryFeatures): DerivedFeatures {
  const pedal_diff = raw.accel_d - raw.accel_e;
  const throttle_gap = raw.throttle - raw.rel_throttle;
  const abs_pedal_diff = Math.abs(pedal_diff);
  const abs_throttle_gap = Math.abs(throttle_gap);
  const load_per_speed = raw.speed > 0 ? raw.load / raw.speed : 0;

  return {
    pedal_diff,
    throttle_gap,
    abs_pedal_diff,
    abs_throttle_gap,
    load_per_speed,
  };
}

export interface ClassProbability {
  className: DtcClass;
  probability: number;
  percentage: number;
  isPredicted: boolean;
}

export interface DtcPredictionResult {
  predictedClass: DtcClass;
  confidence: number;
  probabilities: ClassProbability[];
  derived: DerivedFeatures;
  codeInfo: DtcCodeInfo;
  vector: number[];
  inferenceTimeMs: number;
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exp = arr.map((x) => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((x) => x / sum);
}

export function predictDtc(raw: RawTelemetryFeatures): DtcPredictionResult {
  const t0 = performance.now();
  const derived = computeDerivedFeatures(raw);

  // Exact 19 feature sequence matching model training metadata
  const vector = [
    raw.baro,
    raw.demand_torque,
    raw.rel_throttle,
    raw.accel_e,
    raw.consumption,
    raw.load,
    raw.maf,
    raw.speed,
    raw.ambient_temp,
    raw.rpm,
    raw.actual_torque,
    raw.fuel_level,
    raw.accel_d,
    raw.throttle,
    derived.pedal_diff,
    derived.throttle_gap,
    derived.abs_pedal_diff,
    derived.abs_throttle_gap,
    derived.load_per_speed,
  ];

  const rawPredictions = [...modelData.baseline_prediction];
  const nIter = modelData.n_iter;
  const nTrees = modelData.n_trees_per_iteration;

  for (let it = 0; it < nIter; it++) {
    const iterTrees = modelData.trees[it];
    if (!iterTrees) continue;
    for (let k = 0; k < nTrees; k++) {
      const nodes = iterTrees[k];
      if (!nodes) continue;
      let idx = 0;
      while (true) {
        const node = nodes[idx];
        if (!node) break;
        if (node.leaf) {
          const current = rawPredictions[k] ?? 0;
          rawPredictions[k] = current + node.v;
          break;
        }
        const val = vector[node.f];
        if (val === undefined || isNaN(val)) {
          idx = node.m ? node.l : node.r;
        } else if (val <= node.t) {
          idx = node.l;
        } else {
          idx = node.r;
        }
      }
    }
  }

  const probs = softmax(rawPredictions);
  let bestIdx = 0;
  let maxP = -1;
  probs.forEach((p, idx) => {
    if (p > maxP) {
      maxP = p;
      bestIdx = idx;
    }
  });

  const classes = modelData.classes as DtcClass[];
  const predictedClass = (classes[bestIdx] ?? "NORMAL") as DtcClass;
  const confidence = Math.round(maxP * 1000) / 10;

  const probabilities: ClassProbability[] = classes.map((c, i) => {
    const p = probs[i] ?? 0;
    return {
      className: c,
      probability: p,
      percentage: Math.round(p * 1000) / 10,
      isPredicted: i === bestIdx,
    };
  });

  const codeInfo = DTC_CODE_REGISTRY[predictedClass] ?? DTC_CODE_REGISTRY.NORMAL;
  const t1 = performance.now();

  return {
    predictedClass,
    confidence,
    probabilities,
    derived,
    codeInfo,
    vector,
    inferenceTimeMs: Math.max(0.1, Math.round((t1 - t0) * 100) / 100),
  };
}

export interface TelemetryFieldConfig {
  key: keyof RawTelemetryFeatures;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  category: "engine" | "intake" | "pedal" | "ambient";
  description: string;
}

export const TELEMETRY_FIELDS: TelemetryFieldConfig[] = [
  // Engine & Performance
  { key: "rpm", label: "Engine Speed (RPM)", unit: "RPM", min: 500, max: 6000, step: 50, category: "engine", description: "Engine crankshaft revolutions per minute" },
  { key: "load", label: "Calculated Engine Load", unit: "%", min: 0, max: 100, step: 1, category: "engine", description: "Current torque output relative to peak available" },
  { key: "actual_torque", label: "Actual Engine Torque", unit: "%", min: 0, max: 120, step: 1, category: "engine", description: "Current delivered crankshaft torque percentage" },
  { key: "demand_torque", label: "Driver Demand Torque", unit: "%", min: -10, max: 100, step: 1, category: "engine", description: "Target torque requested by driver via throttle/pedal" },

  // Air & Intake System
  { key: "maf", label: "Mass Air Flow (MAF)", unit: "g/s", min: 2, max: 80, step: 0.5, category: "intake", description: "Rate of intake air entering the engine cylinders" },
  { key: "throttle", label: "Absolute Throttle Position", unit: "%", min: 0, max: 100, step: 0.5, category: "intake", description: "Measured angular opening of throttle butterfly plate" },
  { key: "rel_throttle", label: "Relative Throttle Position", unit: "%", min: 0, max: 100, step: 0.5, category: "intake", description: "Throttle position relative to minimum idle threshold" },
  { key: "baro", label: "Barometric Pressure", unit: "kPa", min: 90, max: 105, step: 0.1, category: "intake", description: "Ambient atmospheric air pressure" },

  // Pedal Position Sensors
  { key: "accel_d", label: "Accelerator Pedal Position D", unit: "%", min: 0, max: 100, step: 0.5, category: "pedal", description: "Potentiometer Track D accelerator pedal travel" },
  { key: "accel_e", label: "Accelerator Pedal Position E", unit: "%", min: 0, max: 100, step: 0.5, category: "pedal", description: "Redundant Potentiometer Track E pedal travel" },

  // Ambient & Fuel Management
  { key: "speed", label: "Vehicle Ground Speed", unit: "km/h", min: 0, max: 200, step: 1, category: "ambient", description: "Vehicle road speed derived from wheel speed sensors" },
  { key: "consumption", label: "Instantaneous Consumption", unit: "L/h", min: 0, max: 35, step: 0.2, category: "ambient", description: "Fuel flow volume per hour" },
  { key: "fuel_level", label: "Fuel Tank Level", unit: "%", min: 0, max: 100, step: 1, category: "ambient", description: "Fuel volume remaining in tank" },
  { key: "ambient_temp", label: "Ambient Air Temperature", unit: "°C", min: -10, max: 50, step: 0.5, category: "ambient", description: "External ambient air temperature sensor" },
];
