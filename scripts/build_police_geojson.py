#!/usr/bin/env python3
"""
Build police.geojson from a given source (URL or local file).

Supports:
- Input: GeoJSON FeatureCollection or CSV.
- Filtering: keep features whose properties indicate police (class/featuretype/agency/name contains "POLICE").
- Coordinates: prefer GeoJSON Point geometry; otherwise try facility_lat/facility_long, then common lat/lon column names.

Usage:
  python scripts/build_police_geojson.py --source <url-or-path> [--out police.geojson]

Examples:
  python scripts/build_police_geojson.py --source https://example/data.geojson
  python scripts/build_police_geojson.py --source data.csv --out police.geojson
"""
from __future__ import annotations
import argparse
import csv
import io
import json
import os
import sys
from typing import Dict, Any, List

try:
    import requests  # type: ignore
except Exception:
    requests = None  # Fallback for offline/local files


LAT_CANDIDATES = [
    'lat','latitude','facility_lat','gnaf_lat','y','Y','y_coord','y_cord','Y_CORD','Y_COORD'
]
LON_CANDIDATES = [
    'lon','lng','longitude','facility_long','gnaf_long','x','X','x_coord','x_cord','X_CORD','X_COORD'
]

POLICE_TOKENS = ['POLICE']
CLASS_VALUES = ['POLICE FACILITY', 'POLICE STATION']


def is_url(path: str) -> bool:
    return path.startswith('http://') or path.startswith('https://')


def fetch_text(path: str) -> str:
    if is_url(path):
        if not requests:
            raise RuntimeError("requests not available; install it or provide a local file")
        r = requests.get(path, timeout=20)
        r.raise_for_status()
        return r.text
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def to_float(v) -> float | None:
    try:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip()
        if not s:
            return None
        return float(s)
    except Exception:
        return None


def looks_like_police(props: Dict[str, Any]) -> bool:
    if not isinstance(props, dict):
        return False
    def get_any(keys: List[str]) -> Any:
        for k in keys:
            if k in props:
                return props[k]
            # case-insensitive
            for kk in props.keys():
                if kk.lower() == k.lower():
                    return props[kk]
        return None
    # explicit class values
    cls = get_any(['class', 'CLASS', 'facility_class'])
    if isinstance(cls, str) and any(cls.upper().startswith(v) or v in cls.upper() for v in CLASS_VALUES):
        return True
    # feature type / agency tokens
    ft = get_any(['featuretype','FEATURETYPE'])
    if isinstance(ft, str) and any(tok in ft.upper() for tok in POLICE_TOKENS):
        return True
    ag = get_any(['agency','AGENCY'])
    if isinstance(ag, str) and any(tok in ag.upper() for tok in POLICE_TOKENS):
        return True
    # name contains police
    nm = get_any(['facility_name','name','NAME','Title','title'])
    if isinstance(nm, str) and any(tok in nm.upper() for tok in POLICE_TOKENS):
        return True
    return False


def feature_from_row(row: Dict[str, Any]) -> Dict[str, Any] | None:
    # Coordinates
    lat = None
    lon = None
    for key in LAT_CANDIDATES:
        if key in row:
            lat = to_float(row[key])
            if lat is not None:
                break
    for key in LON_CANDIDATES:
        if key in row:
            lon = to_float(row[key])
            if lon is not None:
                break
    if lat is None or lon is None:
        return None
    try:
        feat = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": dict(row),
        }
        return feat
    except Exception:
        return None


def build_from_geojson(doc: Dict[str, Any]) -> Dict[str, Any]:
    feats_in = []
    try:
        if doc.get('type') == 'FeatureCollection':
            feats_in = doc.get('features') or []
        elif doc.get('type') == 'Feature':
            feats_in = [doc]
        else:
            # array of features
            if isinstance(doc, list):
                feats_in = doc
    except Exception:
        pass
    features: List[Dict[str, Any]] = []
    for f in feats_in:
        if not isinstance(f, dict):
            continue
        props = f.get('properties') or {}
        if not looks_like_police(props):
            continue
        geom = f.get('geometry')
        if geom and isinstance(geom, dict) and geom.get('type') == 'Point':
            features.append({"type":"Feature","geometry":geom, "properties":props})
            continue
        # No point geometry; try to create from props if lat/lon present
        feat2 = feature_from_row(props)
        if feat2:
            features.append(feat2)
    return {"type":"FeatureCollection","features": features}


def build_from_csv(text: str) -> Dict[str, Any]:
    reader = csv.DictReader(io.StringIO(text))
    features: List[Dict[str, Any]] = []
    for row in reader:
        try:
            if not looks_like_police(row):
                continue
            f = feature_from_row(row)
            if f:
                features.append(f)
        except Exception:
            continue
    return {"type":"FeatureCollection","features": features}


def main():
    ap = argparse.ArgumentParser(description="Build police.geojson from URL or local file")
    ap.add_argument('--source', required=True, help='URL or local file path for source (GeoJSON or CSV)')
    ap.add_argument('--out', default='police.geojson', help='Output GeoJSON path')
    args = ap.parse_args()

    src = args.source
    text = fetch_text(src)
    text_stripped = text.lstrip()
    if text_stripped.startswith('{') or text_stripped.startswith('['):
        try:
            doc = json.loads(text)
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON from {src}: {e}", file=sys.stderr)
            sys.exit(2)
        out = build_from_geojson(doc)
    else:
        # assume CSV
        out = build_from_csv(text)

    # Stats
    n = len(out.get('features') or [])
    print(f"Police features: {n}")

    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"Wrote {args.out}")


if __name__ == '__main__':
    main()
