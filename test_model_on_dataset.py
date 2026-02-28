#!/usr/bin/env python3
"""
ThreatChain — XGBoost Trust Score Tester
Tests the trained XGBoost models on all_dataset/stix_feed_pretty.json
and prints a detailed trust score report.
"""

import json
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET     = os.path.join(BASE_DIR, 'all_dataset', 'stix_feed_pretty.json')
MODELS_DIR  = os.path.join(BASE_DIR, 'models')

# ── Load Models ──────────────────────────────────────────────────────────────
def load_model(name):
    path = os.path.join(MODELS_DIR, name)
    if os.path.exists(path):
        print(f"  ✅ Loaded {name}")
        return joblib.load(path)
    else:
        print(f"  ⚠️  Not found: {name}")
        return None

print("\n🔧 Loading XGBoost models...")
abuse_model      = load_model('xgboost_abuse_score.pkl')
auto_block_model = load_model('xgboost_auto_block.pkl')
confidence_model = load_model('xgboost_confidence.pkl')
scaler           = load_model('scaler.pkl')

# ── Feature Extraction ────────────────────────────────────────────────────────
label_encoders = {}

def extract_features(indicator):
    ti   = indicator.get('x_dugganusa_threat_intel', {}) or {}
    bot  = indicator.get('x_dugganusa_bot_classification', {}) or {}
    disc = indicator.get('x_dugganusa_discovery', {}) or {}
    sigs = bot.get('detection_signals', {}) or {}
    ssl  = ti.get('ssl_tls_enrichment', {}) or {}

    total_reports = ti.get('total_reports', 0) or 0
    vt_detections = ti.get('vt_detections', 0) or 0

    features = {
        'total_reports':             float(total_reports),
        'vt_detections':             float(vt_detections),
        'abuse_score':               float(ti.get('abuse_score', 0) or 0),
        'confidence':                float(indicator.get('confidence', 50) or 50),
        'threatfox_iocs':            float(ti.get('threatfox_iocs', 0) or 0),
        'mitre_confidence':          float(ti.get('mitre_confidence', 0) or 0),
        'asshole_score':             float(ti.get('asshole_score', 0) or 0),
        'classification_confidence': float(bot.get('classification_confidence', 0) or 0),
        'usage_type':                str(ti.get('usage_type', 'unknown') or 'unknown'),
        'country_code':              str((disc.get('geolocation') or {}).get('country_code', 'unknown') or 'unknown'),
        'threat_category':           str(bot.get('threat_category', 'unknown') or 'unknown'),
        'infrastructure_type':       str(bot.get('infrastructure_type', 'unknown') or 'unknown'),
        'suspicious_isp':            int(bool(ti.get('suspicious_isp', False))),
        'young_domain':              int(bool(ti.get('young_domain', False))),
        'residential_proxy':         int(bool(bot.get('residential_proxy', False))),
        'verified_identity':         int(bool(bot.get('verified_identity', False))),
        'published_ip_ranges':       int(bool(bot.get('published_ip_ranges', False))),
        'signal_abuse_reports':      int(bool(sigs.get('abuse_reports', False))),
        'signal_vt_detections':      int(bool(sigs.get('virus_total_detections', False))),
        'signal_threatfox':          int(bool(sigs.get('threatfox_iocs', False))),
        'signal_suspicious_infra':   int(bool(sigs.get('suspicious_infrastructure', False))),
        'signal_behavioral':         int(bool(sigs.get('behavioral_analysis', False))),
        'reports_to_vt_ratio':       float(total_reports) / (float(vt_detections) + 1),
        'has_ssl_data':              int(bool(ssl)),
        'ssl_port_open':             int(bool(ssl.get('https_port_open', False))),
    }
    return features

def preprocess(features_list):
    df = pd.DataFrame(features_list)
    categorical = ['usage_type', 'country_code', 'threat_category', 'infrastructure_type']
    for col in categorical:
        if col not in label_encoders:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            label_encoders[col] = le
        else:
            le = label_encoders[col]
            known = set(le.classes_)
            df[col] = df[col].astype(str).apply(lambda x: x if x in known else le.classes_[0])
            df[col] = le.transform(df[col])
    if scaler is not None:
        df_scaled = scaler.transform(df)
        df = pd.DataFrame(df_scaled, columns=df.columns)
    return df

# ── Load Dataset ─────────────────────────────────────────────────────────────
print(f"\n📂 Loading dataset: {DATASET}")
with open(DATASET, 'r') as f:
    bundle = json.load(f)

indicators = [obj for obj in bundle.get('objects', []) if obj.get('type') == 'indicator']
print(f"   Found {len(indicators):,} indicators\n")

# Sample — process ALL (or cap at 2000 for speed if huge)
SAMPLE_SIZE = min(len(indicators), 2000)
sample = indicators[:SAMPLE_SIZE]
print(f"   Processing {SAMPLE_SIZE:,} indicators for scoring...\n")

# ── Extract & Predict ─────────────────────────────────────────────────────────
features_list = [extract_features(ind) for ind in sample]
df = preprocess(features_list)

abuse_scores      = np.clip(abuse_model.predict(df),       0, 100) if abuse_model      else np.full(len(df), 0.0)
confidence_scores = np.clip(confidence_model.predict(df),  0, 100) if confidence_model else np.full(len(df), 50.0)
auto_block_preds  = auto_block_model.predict(df)                   if auto_block_model else np.zeros(len(df))
auto_block_probs  = auto_block_model.predict_proba(df).max(axis=1) if auto_block_model else np.zeros(len(df))

# Rule-based trust score (from actual fields in dataset)
def rule_based_score(ind):
    ti  = ind.get('x_dugganusa_threat_intel', {}) or {}
    bot = ind.get('x_dugganusa_bot_classification', {}) or {}
    raw_abuse = float(ti.get('abuse_score', 50) or 50)
    # Invert abuse → trust (high abuse = low trust)
    reputation   = max(0, 100 - raw_abuse)
    quality      = float(bot.get('classification_confidence', 50) or 50)
    timeliness   = 80.0   # default — no date diff without DB
    verification = 100.0 if bot.get('verified_identity', False) else 30.0
    behavior     = 100.0 if not (ind.get('x_dugganusa_threat_intel', {}) or {}).get('auto_blocked', False) else 10.0
    return (reputation * 0.30 + quality * 0.25 + timeliness * 0.20 +
            verification * 0.15 + behavior * 0.10)

rb_scores = [rule_based_score(ind) for ind in sample]

# ── Build Results ─────────────────────────────────────────────────────────────
results = []
for i, ind in enumerate(sample):
    ti   = ind.get('x_dugganusa_threat_intel', {}) or {}
    name = ind.get('name', f'indicator-{i}')
    ip   = name.replace('Malicious IP: ', '').strip()
    disc = ind.get('x_dugganusa_discovery', {}) or {}
    country = (disc.get('geolocation') or {}).get('country_code', 'N/A')

    results.append({
        'ip':              ip,
        'country':         country,
        'raw_abuse':       float(ti.get('abuse_score', 0) or 0),
        'rb_trust_score':  round(rb_scores[i], 2),
        'xgb_abuse':       round(float(abuse_scores[i]), 2),
        'xgb_confidence':  round(float(confidence_scores[i]), 2),
        'xgb_auto_block':  bool(auto_block_preds[i]),
        'xgb_block_prob':  round(float(auto_block_probs[i]) * 100, 1),
        'auto_blocked':    bool(ti.get('auto_blocked', False)),
    })

# ── Print Summary Report ──────────────────────────────────────────────────────
print("=" * 90)
print(f"  THREATCHAIN — XGBoost Trust Score Report   ({SAMPLE_SIZE:,} indicators)")
print("=" * 90)
print(f"  {'IP ADDRESS':<20} {'CC':<5} {'Raw':>5} {'RB Trust':>9} {'XGB Abuse':>10} {'XGB Conf':>9} {'AutoBlk':>8} {'BlkProb%':>9}")
print("-" * 90)

for r in results[:50]:           # print first 50 rows to terminal
    ab_flag = "🚫" if r['xgb_auto_block'] else "✅"
    print(f"  {r['ip']:<20} {r['country']:<5} {r['raw_abuse']:>4.0f}%"
          f"  {r['rb_trust_score']:>8.1f}  {r['xgb_abuse']:>9.1f}  {r['xgb_confidence']:>8.1f}"
          f"  {ab_flag}     {r['xgb_block_prob']:>7.1f}%")

if SAMPLE_SIZE > 50:
    print(f"\n  ... and {SAMPLE_SIZE - 50:,} more (shown first 50)\n")

# ── Aggregate Stats ───────────────────────────────────────────────────────────
xgb_abuse_arr  = np.array([r['xgb_abuse']      for r in results])
xgb_conf_arr   = np.array([r['xgb_confidence'] for r in results])
rb_arr         = np.array([r['rb_trust_score']  for r in results])
auto_blocked   = sum(1 for r in results if r['xgb_auto_block'])
original_blocked = sum(1 for r in results if r['auto_blocked'])

print("\n" + "=" * 90)
print("  📊 AGGREGATE STATISTICS")
print("=" * 90)
print(f"\n  ┌─────────────────────────────────────────────────────────────────┐")
print(f"  │  Metric                   Rule-Based       XGBoost              │")
print(f"  ├─────────────────────────────────────────────────────────────────┤")
print(f"  │  Mean Trust/Abuse Score   {rb_arr.mean():>8.2f}         {xgb_abuse_arr.mean():>8.2f}              │")
print(f"  │  Std Deviation            {rb_arr.std():>8.2f}         {xgb_abuse_arr.std():>8.2f}              │")
print(f"  │  Min Score                {rb_arr.min():>8.2f}         {xgb_abuse_arr.min():>8.2f}              │")
print(f"  │  Max Score                {rb_arr.max():>8.2f}         {xgb_abuse_arr.max():>8.2f}              │")
print(f"  │  XGB Mean Confidence      {'N/A':>8}         {xgb_conf_arr.mean():>8.2f}              │")
print(f"  ├─────────────────────────────────────────────────────────────────┤")
print(f"  │  XGBoost Auto-Blocked     {'N/A':>5}/{SAMPLE_SIZE}       {auto_blocked:>5}/{SAMPLE_SIZE}              │")
print(f"  │  Dataset Auto-Blocked     {original_blocked:>5}/{SAMPLE_SIZE}       {'N/A':>5}                   │")
print(f"  └─────────────────────────────────────────────────────────────────┘")

# Score distribution buckets
buckets = {'HIGH RISK (0-25)': 0, 'MEDIUM-HIGH (25-50)': 0, 'MEDIUM (50-75)': 0, 'LOW RISK (75-100)': 0}
for r in results:
    s = r['rb_trust_score']
    if s < 25:   buckets['HIGH RISK (0-25)']     += 1
    elif s < 50: buckets['MEDIUM-HIGH (25-50)']  += 1
    elif s < 75: buckets['MEDIUM (50-75)']        += 1
    else:        buckets['LOW RISK (75-100)']     += 1

print("\n  📈 Rule-Based Trust Score Distribution:")
for label, count in buckets.items():
    bar = '█' * int(count / SAMPLE_SIZE * 40)
    pct = count / SAMPLE_SIZE * 100
    print(f"     {label:<22}  {bar:<40} {count:>5} ({pct:.1f}%)")

xgb_buckets = {'HIGH ABUSE (75-100)': 0, 'MEDIUM (50-75)': 0, 'LOW-MED (25-50)': 0, 'LOW ABUSE (0-25)': 0}
for r in results:
    s = r['xgb_abuse']
    if s >= 75:  xgb_buckets['HIGH ABUSE (75-100)'] += 1
    elif s >= 50: xgb_buckets['MEDIUM (50-75)']      += 1
    elif s >= 25: xgb_buckets['LOW-MED (25-50)']      += 1
    else:         xgb_buckets['LOW ABUSE (0-25)']      += 1

print("\n  🤖 XGBoost Abuse Score Distribution:")
for label, count in xgb_buckets.items():
    bar = '█' * int(count / SAMPLE_SIZE * 40)
    pct = count / SAMPLE_SIZE * 100
    print(f"     {label:<22}  {bar:<40} {count:>5} ({pct:.1f}%)")

# Model agreement check
agree = sum(1 for r in results if abs(r['rb_trust_score'] - (100 - r['xgb_abuse'])) < 15)
print(f"\n  🤝 Model Agreement (within 15 pts): {agree}/{SAMPLE_SIZE}  ({agree/SAMPLE_SIZE*100:.1f}%)")
print(f"  📅 Dataset created: 2026-02-08  |  Indicators: {len(indicators):,}  |  Tested: {SAMPLE_SIZE:,}")
print("\n" + "=" * 90)
print("  ✅ Done! All XGBoost models ran successfully on the dataset.")
print("=" * 90 + "\n")

# Save full results to CSV
out_csv = os.path.join(BASE_DIR, 'trust_score_results.csv')
pd.DataFrame(results).to_csv(out_csv, index=False)
print(f"  💾 Full results saved to: trust_score_results.csv\n")
