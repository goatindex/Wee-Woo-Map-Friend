#!/usr/bin/env python3
"""
Simple preflight to detect duplicate export function names within a single JS file.
Intended to catch mistakes like exporting the same function twice.

Usage:
  python scripts/preflight_check_duplicates.py js

Exits non‑zero if duplicates are found.
"""
from __future__ import annotations
import sys
import re
from pathlib import Path

EXPORT_FUNC_RE = re.compile(r"\bexport\s+function\s+([A-Za-z_$][\w$]*)\s*\(")


def scan_dir(root: Path) -> int:
    dup_count = 0
    for p in root.rglob('*.js'):
        try:
            text = p.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        names = {}
        for m in EXPORT_FUNC_RE.finditer(text):
            name = m.group(1)
            names[name] = names.get(name, 0) + 1
        dups = [n for (n,c) in names.items() if c > 1]
        if dups:
            dup_count += len(dups)
            sys.stderr.write(f"Duplicate exports in {p}: {', '.join(dups)}\n")
    return dup_count


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/preflight_check_duplicates.py <dir>")
        sys.exit(2)
    root = Path(sys.argv[1]).resolve()
    if not root.exists():
        print(f"Path not found: {root}")
        sys.exit(2)
    dup_count = scan_dir(root)
    if dup_count:
        print(f"Found {dup_count} duplicate export name(s).", file=sys.stderr)
        sys.exit(1)
    print("No duplicate export function names found.")


if __name__ == '__main__':
    main()
