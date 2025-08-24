import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
index = (root / 'index.html').read_text(encoding='utf-8')
bootstrap = (root / 'js' / 'bootstrap.js').read_text(encoding='utf-8')
active = (root / 'js' / 'ui' / 'activeList.js').read_text(encoding='utf-8')

ok = True

# 1) index.html: activeList display should be none at load
if 'id="activeList"' in index and 'display: none' in index:
    pass
else:
    print('FAIL: activeList should be hidden on load (display: none).')
    ok = False

# 2) bootstrap.js: setupCollapsible for activeHeader should be false (collapsed)
if re.search(r"setupCollapsible\(\s*'activeHeader'\s*,\s*'activeList'\s*,\s*false\s*\)", bootstrap):
    pass
else:
    print("FAIL: setupCollapsible(activeHeader, activeList, false) not found.")
    ok = False

# 3) activeList.js: should auto-collapse when empty and expand when items exist
has_collapse_empty = 'activeList.style.display = \"none\"' in active
has_expand_when_items = 'activeList.style.display = \"\"' in active
if not has_collapse_empty or not has_expand_when_items:
    print('FAIL: updateActiveList does not toggle display based on item count.')
    ok = False

if ok:
    print('PASS: Active list collapsible preflight checks passed.')
    sys.exit(0)
else:
    sys.exit(1)
