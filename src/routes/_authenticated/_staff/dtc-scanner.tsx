import { createFileRoute } from "@tanstack/react-router";
import { useState, useTransition, useId } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Download,
  FileSpreadsheet,
  Gauge,
  Info,
  Layers,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Upload,
  Wrench,
  Zap,
} from "lucide-react";
import { PageHeader, Panel, KpiStrip } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import {
  predictDtc,
  DEFAULT_TELEMETRY,
  DIAGNOSTIC_PRESETS,
  TELEMETRY_FIELDS,
  type RawTelemetryFeatures,
  type DtcClass,
  type DtcPredictionResult,
  type DiagnosticPreset,
} from "@/lib/workshop/dtc-scanner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_staff/dtc-scanner")({
  head: () => ({ meta: [{ title: "AI DTC Scanner — TorqueWorks" }] }),
  component: DtcScannerPage,
});

export function DtcScannerPage() {
  const [telemetry, setTelemetry] = useState<RawTelemetryFeatures>({ ...DEFAULT_TELEMETRY });
  const [activeCategory, setActiveCategory] = useState<"all" | "engine" | "intake" | "pedal" | "ambient">("all");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTimer, setSimulationTimer] = useState<number | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchResults, setBatchResults] = useState<{
    totalFrames: number;
    normalCount: number;
    dtcCount: number;
    distribution: Record<DtcClass, number>;
    rows: { index: number; code: DtcClass; confidence: number; speed: number; rpm: number }[];
  } | null>(null);

  // Real-time prediction
  const result: DtcPredictionResult = predictDtc(telemetry);

  const handleFieldChange = (key: keyof RawTelemetryFeatures, value: number) => {
    setTelemetry((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (preset: DiagnosticPreset) => {
    if (simulationTimer) {
      window.clearInterval(simulationTimer);
      setSimulationTimer(null);
      setIsSimulating(false);
    }
    setTelemetry({ ...preset.telemetry });
    toast.success(`Loaded Preset: ${preset.name}`, {
      description: `Targeting expected condition: ${preset.targetClass}`,
    });
  };

  const handleReset = () => {
    if (simulationTimer) {
      window.clearInterval(simulationTimer);
      setSimulationTimer(null);
      setIsSimulating(false);
    }
    setTelemetry({ ...DEFAULT_TELEMETRY });
    toast.info("Telemetry reset to factory baseline.");
  };

  const toggleSimulation = () => {
    if (isSimulating && simulationTimer) {
      window.clearInterval(simulationTimer);
      setSimulationTimer(null);
      setIsSimulating(false);
      toast.info("Live road drive simulation paused.");
      return;
    }

    setIsSimulating(true);
    let step = 0;
    const timer = window.setInterval(() => {
      step++;
      setTelemetry((prev) => {
        const rpmFluct = Math.sin(step * 0.3) * 200 + (Math.random() - 0.5) * 60;
        const speedFluct = Math.sin(step * 0.15) * 15;
        const loadFluct = Math.cos(step * 0.2) * 12;

        return {
          ...prev,
          rpm: Math.max(700, Math.min(4500, Math.round(prev.rpm + rpmFluct * 0.05))),
          speed: Math.max(0, Math.min(140, Math.round((prev.speed + speedFluct * 0.05) * 10) / 10)),
          load: Math.max(10, Math.min(95, Math.round((prev.load + loadFluct * 0.05) * 10) / 10)),
          maf: Math.max(4, Math.min(45, Math.round((prev.maf + (Math.random() - 0.5) * 0.8) * 10) / 10)),
        };
      });
    }, 400);

    setSimulationTimer(timer);
    toast.success("Live drive cycle simulation running...");
  };

  const handleCopyReport = () => {
    const lines = [
      `TORQUEWORKS AI DTC DIAGNOSTIC SCAN REPORT`,
      `=========================================`,
      `Model: dtc_scanner_final (HistGradientBoostingClassifier)`,
      `Status: ${result.predictedClass === "NORMAL" ? "ALL SYSTEMS NOMINAL" : `FAULT CODE DETECTED: ${result.predictedClass}`}`,
      `Confidence: ${result.confidence}% (Inference latency: ${result.inferenceTimeMs}ms)`,
      `Title: ${result.codeInfo.title}`,
      `Subsystem: ${result.codeInfo.subsystem}`,
      ``,
      `PROBABILITY BREAKDOWN:`,
      ...result.probabilities.map((p) => `  - ${p.className}: ${p.percentage}%`),
      ``,
      `ENGINEERED FEATURES:`,
      `  - pedal_diff (D - E): ${result.derived.pedal_diff.toFixed(2)} %`,
      `  - throttle_gap (Throttle - Rel): ${result.derived.throttle_gap.toFixed(2)} %`,
      `  - abs_pedal_diff: ${result.derived.abs_pedal_diff.toFixed(2)} %`,
      `  - abs_throttle_gap: ${result.derived.abs_throttle_gap.toFixed(2)} %`,
      `  - load_per_speed: ${result.derived.load_per_speed.toFixed(3)}`,
      ``,
      `TELEMETRY VALUES:`,
      `  - RPM: ${telemetry.rpm} | Speed: ${telemetry.speed} km/h | Load: ${telemetry.load}%`,
      `  - MAF: ${telemetry.maf} g/s | Throttle: ${telemetry.throttle}% | Baro: ${telemetry.baro} kPa`,
      `  - Pedal D: ${telemetry.accel_d}% | Pedal E: ${telemetry.accel_e}%`,
      `  - Ambient Temp: ${telemetry.ambient_temp}°C | Fuel: ${telemetry.fuel_level}%`,
      ``,
      `RECOMMENDED MECHANIC ACTIONS:`,
      ...result.codeInfo.mechanicActions.map((a, i) => `  ${i + 1}. ${a}`),
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Diagnostic Report copied to clipboard!");
  };

  const loadSampleCsv = () => {
    const mockRows = [];
    const classesList: DtcClass[] = ["NORMAL", "P0115", "P0120", "P0171", "P0300"];
    const counts: Record<DtcClass, number> = {
      NORMAL: 0,
      P0115: 0,
      P0120: 0,
      P0171: 0,
      P0300: 0,
    };

    // Generate 120 sample drive cycle frames
    for (let i = 0; i < 120; i++) {
      let code: DtcClass = "NORMAL";
      if (i > 35 && i < 48) code = "P0171";
      else if (i > 75 && i < 84) code = "P0120";
      else if (i > 100 && i < 110) code = "P0300";

      counts[code]++;
      mockRows.push({
        index: i + 1,
        code,
        confidence: code === "NORMAL" ? 99.8 : 98.4,
        speed: Math.round(40 + Math.sin(i * 0.1) * 25),
        rpm: Math.round(1800 + Math.cos(i * 0.1) * 600),
      });
    }

    setBatchResults({
      totalFrames: 120,
      normalCount: counts.NORMAL,
      dtcCount: 120 - counts.NORMAL,
      distribution: counts,
      rows: mockRows,
    });
    setBatchModalOpen(true);
    toast.success("Loaded and analyzed 120-frame OBD-II drive cycle log!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) {
          toast.error("CSV file contains no telemetry data rows.");
          return;
        }

        const headers = lines[0]!.toLowerCase().split(",").map((h) => h.trim());
        const mockRows = [];
        const counts: Record<DtcClass, number> = {
          NORMAL: 0,
          P0115: 0,
          P0120: 0,
          P0171: 0,
          P0300: 0,
        };

        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i]!.split(",").map((v) => parseFloat(v.trim()));
          if (vals.some(isNaN)) continue;

          // Simple dynamic mapping from file or fallback to base
          const frameTelemetry: RawTelemetryFeatures = {
            baro: vals[headers.indexOf("barometric pressure")] ?? telemetry.baro,
            demand_torque: vals[headers.indexOf("divers demand engine percent torque")] ?? telemetry.demand_torque,
            rel_throttle: vals[headers.indexOf("relative throttle position")] ?? telemetry.rel_throttle,
            accel_e: vals[headers.indexOf("accelerator pedal position e")] ?? telemetry.accel_e,
            consumption: vals[headers.indexOf("consumption rate")] ?? telemetry.consumption,
            load: vals[headers.indexOf("load")] ?? telemetry.load,
            maf: vals[headers.indexOf("mass air flow")] ?? telemetry.maf,
            speed: vals[headers.indexOf("speed")] ?? telemetry.speed,
            ambient_temp: vals[headers.indexOf("ambient air temperature")] ?? telemetry.ambient_temp,
            rpm: vals[headers.indexOf("rpm")] ?? telemetry.rpm,
            actual_torque: vals[headers.indexOf("actual engine percent torque")] ?? telemetry.actual_torque,
            fuel_level: vals[headers.indexOf("fuel level")] ?? telemetry.fuel_level,
            accel_d: vals[headers.indexOf("accelerator pedal position d")] ?? telemetry.accel_d,
            throttle: vals[headers.indexOf("throttle position")] ?? telemetry.throttle,
          };

          const frameRes = predictDtc(frameTelemetry);
          counts[frameRes.predictedClass]++;
          mockRows.push({
            index: i,
            code: frameRes.predictedClass,
            confidence: frameRes.confidence,
            speed: frameTelemetry.speed,
            rpm: frameTelemetry.rpm,
          });
        }

        setBatchResults({
          totalFrames: mockRows.length,
          normalCount: counts.NORMAL,
          dtcCount: mockRows.length - counts.NORMAL,
          distribution: counts,
          rows: mockRows,
        });
        setBatchModalOpen(true);
        toast.success(`Successfully analyzed ${mockRows.length} frames from CSV!`);
      } catch (err) {
        toast.error("Failed to parse CSV file. Ensure valid numeric format.");
      }
    };
    reader.readAsText(file);
  };

  const isFault = result.predictedClass !== "NORMAL";
  const severityColor =
    result.codeInfo.severity === "nominal"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : result.codeInfo.severity === "warning"
        ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
        : result.codeInfo.severity === "critical"
          ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
          : "text-red-400 border-red-500/30 bg-red-500/10";

  const filteredFields = TELEMETRY_FIELDS.filter(
    (f) => activeCategory === "all" || f.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        eyebrow="Staff Intelligence · Powertrain Diagnostics"
        title="DTC SCANNER"
        accent="FINAL"
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-primary/50">
              <Upload className="size-3.5 text-primary" />
              Upload OBD-II CSV
            </span>
          </label>

          <Button
            size="sm"
            variant="outline"
            onClick={loadSampleCsv}
            className="text-xs font-semibold gap-1.5 border-border/70"
          >
            <FileSpreadsheet className="size-3.5 text-amber-400" />
            Sample Drive Log
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={toggleSimulation}
            className={cn(
              "text-xs font-semibold gap-1.5 border-border/70",
              isSimulating && "border-primary/70 bg-primary/10 text-primary"
            )}
          >
            <Play className={cn("size-3.5", isSimulating && "animate-spin text-primary")} />
            {isSimulating ? "Stop Road Sim" : "Road Test Sim"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="text-xs font-semibold gap-1.5 border-border/70 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
            Reset Spec
          </Button>

          <Button
            size="sm"
            onClick={handleCopyReport}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-3.5" />
            Export Brief
          </Button>
        </div>
      </PageHeader>

      {/* KPI Diagnostic Strip */}
      <KpiStrip
        items={[
          {
            label: "CLASSIFIER MODEL",
            value: "dtc_scanner_final",
            sub: "100-iter HistGradientBoosting",
          },
          {
            label: "DIAGNOSTIC STATUS",
            value: isFault ? (
              <span className="text-destructive font-black tracking-wide">{result.predictedClass}</span>
            ) : (
              <span className="text-emerald-400 font-black tracking-wide">NORMAL</span>
            ),
            sub: isFault ? "Active Fault Code Detected" : "Powertrain Nominal",
            hot: isFault,
          },
          {
            label: "MODEL CONFIDENCE",
            value: `${result.confidence}%`,
            sub: `Top probability out of 5 classes`,
          },
          {
            label: "INFERENCE LATENCY",
            value: `${result.inferenceTimeMs} ms`,
            sub: "Real-time client execution",
          },
        ]}
      />

      {/* Preset Fast-Pick Bar */}
      <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Diagnostic Scenario Presets (1-Click Test)
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
            Click to load realistic fault telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {DIAGNOSTIC_PRESETS.map((p) => {
            const isMatch = result.predictedClass === p.targetClass;
            return (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                className={cn(
                  "group flex flex-col items-start rounded-lg border p-2.5 text-left transition-all duration-200",
                  isMatch
                    ? "border-primary/80 bg-primary/10 shadow-sm"
                    : "border-border/60 bg-secondary/20 hover:border-border hover:bg-secondary/40"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={cn(
                      "font-mono text-[11px] font-black uppercase tracking-wider",
                      p.targetClass === "NORMAL" ? "text-emerald-400" : "text-amber-400"
                    )}
                  >
                    {p.targetClass}
                  </span>
                  {isMatch && (
                    <span className="size-2 rounded-full bg-primary animate-ping" />
                  )}
                </div>
                <span className="mt-1 line-clamp-1 text-xs font-bold text-foreground">
                  {p.name}
                </span>
                <span className="line-clamp-1 text-[10px] text-muted-foreground">
                  {p.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Diagnostic Workspace: Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Real-time Analysis & Guide (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Active Diagnostic Status Panel */}
          <Panel
            title="Active Powertrain Diagnosis"
            meta={
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider",
                  severityColor
                )}
              >
                {isFault ? (
                  <>
                    <AlertTriangle className="size-3" />
                    <span>DTC Fault Detected</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3" />
                    <span>Nominal Operation</span>
                  </>
                )}
              </span>
            }
          >
            <div className="space-y-5">
              {/* Primary Callout */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border p-5 transition-all duration-300",
                  isFault
                    ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card"
                    : "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                        {result.predictedClass}
                      </span>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 font-mono text-xs font-bold uppercase",
                          severityColor
                        )}
                      >
                        {result.codeInfo.severity}
                      </span>
                    </div>
                    <p className="text-base font-bold text-foreground sm:text-lg">
                      {result.codeInfo.title}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground uppercase">
                      Subsystem: {result.codeInfo.subsystem}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-3xl font-black text-foreground">
                      {result.confidence}%
                    </span>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      AI Confidence
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {result.codeInfo.description}
                </p>
              </div>

              {/* Multi-Class Probability Spectrum */}
              <div className="space-y-2 rounded-xl border border-border/70 bg-secondary/20 p-4">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Layers className="size-3.5 text-primary" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Model Class Probabilities (Softmax Spectrum)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Sum: 100.0%
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {result.probabilities.map((prob) => {
                    const isWinner = prob.isPredicted;
                    return (
                      <div key={prob.className} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span
                            className={cn(
                              "font-mono font-bold",
                              isWinner ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {prob.className}
                            {isWinner && " ★ (Predicted)"}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {prob.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              prob.className === "NORMAL"
                                ? "bg-emerald-400"
                                : prob.className === "P0115"
                                  ? "bg-amber-400"
                                  : prob.className === "P0120"
                                    ? "bg-orange-500"
                                    : prob.className === "P0171"
                                      ? "bg-amber-500"
                                      : "bg-red-500",
                              !isWinner && "opacity-40"
                            )}
                            style={{ width: `${Math.max(1, prob.percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Engineered / Derived Features (What the model depends on) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-primary" />
                    <span className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
                      Engineered Model Features (5 Derived Features)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Computed live for classifier input
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {/* pedal_diff */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 shadow-inner">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      pedal_diff (D - E)
                    </span>
                    <p className="mt-1 font-mono text-lg font-black text-foreground">
                      {result.derived.pedal_diff.toFixed(2)}%
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Track D ({telemetry.accel_d}%) vs E ({telemetry.accel_e}%)
                    </span>
                  </div>

                  {/* throttle_gap */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 shadow-inner">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      throttle_gap (Abs - Rel)
                    </span>
                    <p className="mt-1 font-mono text-lg font-black text-foreground">
                      {result.derived.throttle_gap.toFixed(2)}%
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Abs ({telemetry.throttle}%) vs Rel ({telemetry.rel_throttle}%)
                    </span>
                  </div>

                  {/* abs_pedal_diff */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 shadow-inner">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      abs_pedal_diff
                    </span>
                    <p className="mt-1 font-mono text-lg font-black text-foreground">
                      {result.derived.abs_pedal_diff.toFixed(2)}%
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Absolute pedal divergence
                    </span>
                  </div>

                  {/* abs_throttle_gap */}
                  <div className="rounded-lg border border-border/70 bg-card p-3 shadow-inner">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      abs_throttle_gap
                    </span>
                    <p className="mt-1 font-mono text-lg font-black text-foreground">
                      {result.derived.abs_throttle_gap.toFixed(2)}%
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Absolute throttle correlation gap
                    </span>
                  </div>

                  {/* load_per_speed */}
                  <div className="col-span-2 sm:col-span-1 rounded-lg border border-border/70 bg-card p-3 shadow-inner">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      load_per_speed
                    </span>
                    <p className="mt-1 font-mono text-lg font-black text-foreground">
                      {result.derived.load_per_speed.toFixed(3)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Load ({telemetry.load}%) / Speed ({telemetry.speed} km/h)
                    </span>
                  </div>
                </div>
              </div>

              {/* In-Depth Mechanic Guide for active code */}
              <div className="space-y-4 rounded-xl border border-border/70 bg-secondary/15 p-5">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                  <Wrench className="size-4 text-primary" />
                  <span className="font-mono text-sm font-black uppercase tracking-wider text-foreground">
                    Mechanic Diagnostic Action Protocol
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Symptoms */}
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                      Driver / Vehicle Symptoms
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      {result.codeInfo.symptoms.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Likely Causes */}
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                      Probable Root Causes
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      {result.codeInfo.causes.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 rounded-full bg-destructive shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Step-by-step checklist */}
                <div className="space-y-2 border-t border-border/50 pt-3">
                  <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                    Recommended Workshop Inspection Steps
                  </span>
                  <div className="space-y-2 text-xs text-foreground">
                    {result.codeInfo.mechanicActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-2.5"
                      >
                        <span className="grid size-5 shrink-0 place-items-center rounded bg-primary/20 font-mono text-[11px] font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Side: Telemetry Control Console (14 Raw Features) (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Panel
            title="OBD-II Telemetry Console"
            meta={
              <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Sliders className="size-3.5 text-primary" />
                <span>14 Raw Sensors</span>
              </div>
            }
          >
            {/* Category Filter Pills */}
            <div className="mb-4 flex flex-wrap gap-1 border-b border-border/60 pb-3">
              {(
                [
                  { id: "all", label: "All Sensors" },
                  { id: "engine", label: "Engine" },
                  { id: "intake", label: "Air / Intake" },
                  { id: "pedal", label: "Pedal Tracks" },
                  { id: "ambient", label: "Speed & Fuel" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-all",
                    activeCategory === tab.id
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Telemetry Sliders and Number Inputs */}
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
              {filteredFields.map((field) => {
                const val = telemetry[field.key];
                return (
                  <div
                    key={field.key}
                    className="rounded-lg border border-border/60 bg-secondary/10 p-3 transition-colors hover:border-border hover:bg-secondary/25"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <label
                          htmlFor={`field-${field.key}`}
                          className="font-mono text-xs font-bold text-foreground block"
                        >
                          {field.label}
                        </label>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {field.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id={`field-${field.key}`}
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={val}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value);
                            if (!isNaN(num)) handleFieldChange(field.key, num);
                          }}
                          className="w-20 rounded border border-border/80 bg-card px-2 py-1 text-right font-mono text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                        />
                        <span className="font-mono text-[11px] text-muted-foreground w-7">
                          {field.unit}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground w-6 text-right">
                        {field.min}
                      </span>
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={val}
                        onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                      />
                      <span className="font-mono text-[10px] text-muted-foreground w-6">
                        {field.max}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* Batch CSV Analysis Modal / Overlay */}
      {batchModalOpen && batchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-xl font-black text-foreground">
                  OBD-II CSV BATCH DIAGNOSTIC ANALYSIS
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  Processed {batchResults.totalFrames} telemetry frames through dtc_scanner_final
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBatchModalOpen(false)}
                className="font-mono text-xs font-bold"
              >
                ✕ Close
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  Total Frames
                </span>
                <p className="font-mono text-xl font-black text-foreground">
                  {batchResults.totalFrames}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-emerald-500/10 p-3">
                <span className="font-mono text-[10px] text-emerald-400 uppercase">
                  Normal Frames
                </span>
                <p className="font-mono text-xl font-black text-emerald-400">
                  {batchResults.normalCount} (
                  {Math.round((batchResults.normalCount / batchResults.totalFrames) * 100)}%)
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-destructive/10 p-3">
                <span className="font-mono text-[10px] text-destructive uppercase">
                  DTC Fault Events
                </span>
                <p className="font-mono text-xl font-black text-destructive">
                  {batchResults.dtcCount}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  Fault Distribution
                </span>
                <p className="font-mono text-xs font-bold text-foreground mt-1">
                  P0171: {batchResults.distribution.P0171} · P0120: {batchResults.distribution.P0120} · P0300: {batchResults.distribution.P0300}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-2">
                Frame Timeline Log (Sample Slice)
              </span>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border/70 bg-secondary/10">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-border/60 bg-secondary/40 text-[10px] uppercase text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-2">Frame #</th>
                      <th className="p-2">Speed</th>
                      <th className="p-2">RPM</th>
                      <th className="p-2">Diagnosis</th>
                      <th className="p-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {batchResults.rows.slice(0, 50).map((row) => (
                      <tr
                        key={row.index}
                        className={cn(
                          row.code !== "NORMAL" && "bg-destructive/10 font-bold"
                        )}
                      >
                        <td className="p-2">{row.index}</td>
                        <td className="p-2">{row.speed} km/h</td>
                        <td className="p-2">{row.rpm} RPM</td>
                        <td
                          className={cn(
                            "p-2",
                            row.code === "NORMAL" ? "text-emerald-400" : "text-amber-400"
                          )}
                        >
                          {row.code}
                        </td>
                        <td className="p-2">{row.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-border/60 pt-3">
              <Button
                size="sm"
                onClick={() => setBatchModalOpen(false)}
                className="bg-primary text-primary-foreground font-bold text-xs"
              >
                Close Analysis
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
