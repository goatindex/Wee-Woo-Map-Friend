#!/usr/bin/env python3
"""
Fetch police facilities from an ArcGIS Feature Service layer and write a GeoJSON file.

- Tries to query with f=geojson (preferred), paginated via resultOffset/resultRecordCount.
- Falls back to f=json and converts Point features if f=geojson is unsupported.
- Auto-detects field names for filters (CLASS/FEATURETYPE/AGENCY/NAME/FACILITY_NAME).

Usage:
  python scripts/fetch_arcgis_police.py --layer-url "https://.../FeatureServer/8" --out police.geojson
"""
from __future__ import annotations
import argparse
import json
import sys
from typing import Any, Dict, List, Tuple

import urllib.parse

try:
    import requests  # type: ignore
except Exception as e:
    print("ERROR: requests is required. Install it in your venv.", file=sys.stderr)
    raise


def get_layer_info(base_url: str) -> Dict[str, Any]:
    url = f"{base_url}?f=json"
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r.json()


def detect_filter_fields(layer_info: Dict[str, Any]) -> Dict[str, str]:
    fields = layer_info.get('fields') or []
    name_map = {}
    for f in fields:
        nm = f.get('name')
        if not isinstance(nm, str):
            continue
        low = nm.lower()
        name_map[low] = nm
    # Prefer these if present
    picks = {
        'class': name_map.get('class') or name_map.get('facility_class'),
        'featuretype': name_map.get('featuretype'),
        'agency': name_map.get('agency'),
        'name': name_map.get('name') or name_map.get('facility_name'),
        'facility_name': name_map.get('facility_name'),
    }
    return {k: v for k, v in picks.items() if v}


def build_where(fields: Dict[str, str]) -> str:
    clauses: List[str] = []
    for cand in ['class', 'featuretype', 'agency', 'name', 'facility_name']:
        fn = fields.get(cand)
        if fn:
            clauses.append(f"UPPER({fn}) LIKE '%POLICE%'")
    return ' OR '.join(clauses) if clauses else '1=1'


def query_features_geojson(base_url: str, where: str, page_size: int = 2000) -> List[Dict[str, Any]]:
    features: List[Dict[str, Any]] = []
    offset = 0
    while True:
        params = {
            'where': where,
            'outFields': '*',
            'outSR': '4326',
            'f': 'geojson',
            'resultRecordCount': str(page_size),
            'resultOffset': str(offset),
        }
        qurl = f"{base_url}/query?{urllib.parse.urlencode(params)}"
        r = requests.get(qurl, timeout=60)
        if r.status_code >= 400:
            raise RuntimeError(f"GeoJSON query failed: {r.status_code} {r.text[:200]}")
        j = r.json()
        feats = j.get('features') or []
        if not feats:
            break
        features.extend(feats)
        # If fewer than page_size returned, we are done
        if len(feats) < page_size:
            break
        offset += page_size
    return features


def query_features_json(base_url: str, where: str, page_size: int = 2000) -> Tuple[str, List[Dict[str, Any]]]:
    """Return geometryType and features (attributes+geometry) from f=json query."""
    features: List[Dict[str, Any]] = []
    offset = 0
    geom_type = ''
    while True:
        params = {
            'where': where,
            'outFields': '*',
            'outSR': '4326',
            'f': 'json',
            'resultRecordCount': str(page_size),
            'resultOffset': str(offset),
            'returnGeometry': 'true',
        }
        qurl = f"{base_url}/query?{urllib.parse.urlencode(params)}"
        r = requests.get(qurl, timeout=60)
        r.raise_for_status()
        j = r.json()
        if not geom_type:
            geom_type = j.get('geometryType') or ''
        feats = j.get('features') or []
        if not feats:
            break
        features.extend(feats)
        if len(feats) < page_size:
            break
        offset += page_size
    return geom_type, features


def to_geojson_points_from_json(geom_type: str, esri_features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for f in esri_features:
        attrs = f.get('attributes') or {}
        geom = f.get('geometry') or {}
        # Only convert points reliably
        if geom_type and 'point' not in geom_type.lower():
            # attempt best-effort point extraction
            x = geom.get('x')
            y = geom.get('y')
        else:
            x = geom.get('x')
            y = geom.get('y')
        if isinstance(x, (int, float)) and isinstance(y, (int, float)):
            out.append({
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [x, y]},
                'properties': attrs,
            })
    return out


def main():
    ap = argparse.ArgumentParser(description='Fetch police facilities from ArcGIS Feature Service layer')
    ap.add_argument('--layer-url', required=True, help='Layer URL (e.g., .../FeatureServer/8)')
    ap.add_argument('--out', default='police.geojson', help='Output GeoJSON path')
    args = ap.parse_args()

    base = args.layer_url.rstrip('/')
    info = get_layer_info(base)
    fields = detect_filter_fields(info)
    where = build_where(fields) or '1=1'

    print(f"Using WHERE: {where}")
    features: List[Dict[str, Any]] = []
    try:
        print('Querying as GeoJSON...')
        features = query_features_geojson(base, where)
    except Exception as e:
        print(f"GeoJSON query failed ({e}). Falling back to JSON conversion...")
        geom_type, feats_json = query_features_json(base, where)
        features = to_geojson_points_from_json(geom_type, feats_json)

    fc = {'type': 'FeatureCollection', 'features': features}
    count = len(features)
    print(f"Fetched police features: {count}")
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(fc, f, ensure_ascii=False)
    print(f"Wrote {args.out}")


if __name__ == '__main__':
    main()
