#!/usr/bin/env python3
"""
TorqueWorks AI - dtc_scanner_final Diagnostic CLI & Inference Engine
Loads and runs inference using dtc_scanner_final.pkl
"""

import sys
import os
import argparse
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "dtc_scanner_final.pkl")

# Raw input feature names
RAW_FEATURES = [
    "Barometric Pressure",
    "Divers Demand Engine Percent Torque",
    "Relative Throttle Position",
    "Accelerator Pedal Position E",
    "Consumption Rate",
    "Load",
    "Mass Air Flow",
    "Speed",
    "Ambient Air Temperature",
    "RPM",
    "Actual Engine Percent Torque",
    "Fuel Level",
    "Accelerator Pedal Position D",
    "Throttle Position",
]

# Engineered feature names the model depends on
DERIVED_FEATURES = [
    "pedal_diff",
    "throttle_gap",
    "abs_pedal_diff",
    "abs_throttle_gap",
    "load_per_speed",
]

DEFAULT_VALUES = {
    "Barometric Pressure": 99.0,
    "Divers Demand Engine Percent Torque": 25.0,
    "Relative Throttle Position": 18.0,
    "Accelerator Pedal Position E": 22.0,
    "Consumption Rate": 4.5,
    "Load": 35.0,
    "Mass Air Flow": 14.5,
    "Speed": 55.0,
    "Ambient Air Temperature": 32.0,
    "RPM": 1850.0,
    "Actual Engine Percent Torque": 26.0,
    "Fuel Level": 92.0,
    "Accelerator Pedal Position D": 22.5,
    "Throttle Position": 20.0,
}

DTC_DESCRIPTIONS = {
    "NORMAL": "All Powertrain Systems Operating within Nominal Factory Tolerances",
    "P0115": "Engine Coolant Temperature (ECT) Circuit Malfunction",
    "P0120": "Throttle/Pedal Position Sensor/Switch 'A' Circuit Malfunction",
    "P0171": "Fuel Trim System Too Lean (Bank 1)",
    "P0300": "Random/Multiple Cylinder Misfire Detected",
}

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
    bundle = joblib.load(MODEL_PATH)
    return bundle

def compute_derived_features(raw_dict):
    """Computes the 5 engineered features required by the AI model."""
    d = raw_dict["Accelerator Pedal Position D"]
    e = raw_dict["Accelerator Pedal Position E"]
    throttle = raw_dict["Throttle Position"]
    rel_throttle = raw_dict["Relative Throttle Position"]
    load = raw_dict["Load"]
    speed = raw_dict["Speed"]

    pedal_diff = float(d - e)
    throttle_gap = float(throttle - rel_throttle)
    abs_pedal_diff = float(abs(pedal_diff))
    abs_throttle_gap = float(abs(throttle_gap))
    load_per_speed = float(load / speed if speed > 0 else 0.0)

    return {
        "pedal_diff": pedal_diff,
        "throttle_gap": throttle_gap,
        "abs_pedal_diff": abs_pedal_diff,
        "abs_throttle_gap": abs_throttle_gap,
        "load_per_speed": load_per_speed,
    }

def predict_single(telemetry_dict):
    bundle = load_model()
    model = bundle["model"]
    feature_order = bundle["features"]
    classes = bundle["classes"]

    # Compute derived features
    derived = compute_derived_features(telemetry_dict)
    full_dict = {**telemetry_dict, **derived}

    # Construct DataFrame
    df = pd.DataFrame([full_dict])[feature_order]

    # Predict
    pred_idx = model.predict(df)[0]
    probabilities = model.predict_proba(df)[0]
    predicted_class = classes[pred_idx]
    confidence = float(probabilities[pred_idx] * 100)

    prob_map = {classes[i]: float(probabilities[i] * 100) for i in range(len(classes))}

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "probabilities": prob_map,
        "derived_features": derived,
        "description": DTC_DESCRIPTIONS.get(predicted_class, "Unknown Code"),
    }

def main():
    parser = argparse.ArgumentParser(description="TorqueWorks AI DTC Scanner CLI")
    parser.add_argument("--test-preset", choices=["normal", "p0115", "p0120", "p0171", "p0300"], default="normal")
    parser.add_argument("--rpm", type=float)
    parser.add_argument("--speed", type=float)
    parser.add_argument("--load", type=float)
    parser.add_argument("--maf", type=float)
    args = parser.parse_args()

    presets = {
        "normal": DEFAULT_VALUES,
        "p0115": {**DEFAULT_VALUES, "Ambient Air Temperature": 28.5, "RPM": 1200.0, "Load": 25.0, "Mass Air Flow": 8.0, "Speed": 40.0},
        "p0120": {**DEFAULT_VALUES, "Throttle Position": 22.0, "Relative Throttle Position": 85.0, "Accelerator Pedal Position D": 55.0, "Accelerator Pedal Position E": 20.0, "Load": 75.0, "Speed": 65.0},
        "p0171": {**DEFAULT_VALUES, "Mass Air Flow": 6.0, "Load": 94.5, "Speed": 53.5, "Ambient Air Temperature": 30.4, "RPM": 1395.0, "Throttle Position": 31.3},
        "p0300": {**DEFAULT_VALUES, "Load": 89.8, "Speed": 12.4, "RPM": 1740.0, "Mass Air Flow": 23.3, "Ambient Air Temperature": 34.1},
    }

    t = presets[args.test_preset].copy()
    if args.rpm is not None: t["RPM"] = args.rpm
    if args.speed is not None: t["Speed"] = args.speed
    if args.load is not None: t["Load"] = args.load
    if args.maf is not None: t["Mass Air Flow"] = args.maf

    print("\n=======================================================")
    print("   TORQUEWORKS AI - dtc_scanner_final ENGINE")
    print("=======================================================")
    res = predict_single(t)

    print(f"Status:             {res['predicted_class']}")
    print(f"Confidence:         {res['confidence']:.2f}%")
    print(f"Description:        {res['description']}")
    print("\nDerived Features (computed by model dependency):")
    for k, v in res['derived_features'].items():
        print(f"  {k:18s}: {v:.3f}")
    print("\nProbability Spectrum:")
    for cls, pct in res['probabilities'].items():
        bar = "#" * int(pct / 5)
        print(f"  {cls:7s}: {pct:5.2f}% {bar}")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
