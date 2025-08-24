#!/usr/bin/env python3
"""
Filter police.geojson to only include features with properties.feature == "POLICE STATION".

Usage:
  python scripts/filter_police_geojson.py --in police.geojson --out police.geojson
"""
from __future__ import annotations
import argparse
import json
from typing import Any, Dict


def main():
	ap = argparse.ArgumentParser(description='Filter police.geojson by feature type')
	ap.add_argument('--in', dest='inp', default='police.geojson', help='Input GeoJSON path')
	ap.add_argument('--out', dest='out', default='police.geojson', help='Output GeoJSON path (will be overwritten)')
	args = ap.parse_args()

	with open(args.inp, 'r', encoding='utf-8') as f:
		doc = json.load(f)

	feats = doc.get('features') or []
	kept = []
	for f in feats:
		try:
			props: Dict[str, Any] = f.get('properties') or {}
			val = props.get('feature') or props.get('FEATURE') or ''
			if isinstance(val, str) and val.strip().upper() == 'POLICE STATION':
				kept.append(f)
		except Exception:
			continue

	out = {'type': 'FeatureCollection', 'features': kept}
	with open(args.out, 'w', encoding='utf-8') as f:
		json.dump(out, f, ensure_ascii=False)
	print(f"Filtered: kept {len(kept)} of {len(feats)} features -> {args.out}")


if __name__ == '__main__':
	main()

