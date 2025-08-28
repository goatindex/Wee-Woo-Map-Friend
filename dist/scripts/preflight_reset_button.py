import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'index.html'
BOOTSTRAP = ROOT / 'js' / 'bootstrap.js'

def read(p: Path) -> str:
    try:
        return p.read_text(encoding='utf-8')
    except Exception as e:
        print(f"FAIL: Could not read {p}: {e}")
        raise

def check_recycle_button(html: str) -> list[str]:
    msgs = []
    if 'id="sidebarBtn1"' not in html:
        msgs.append('FAIL: sidebarBtn1 not found in index.html')
    # Try to verify the recycle emoji is present near the button
    btn_match = re.search(r'<button[^>]*id="sidebarBtn1"[^>]*>(.*?)</button>', html, re.DOTALL | re.IGNORECASE)
    if not btn_match:
        msgs.append('FAIL: Could not locate the sidebarBtn1 button markup')
    else:
        label = btn_match.group(1).strip()
        if '♻️' not in label:
            msgs.append('WARN: sidebarBtn1 does not contain the ♻️ emoji')
    return msgs

def check_dispatch_wiring(js: str) -> list[str]:
    msgs = []
    # Ensure the tool buttons are wired and dispatch a CustomEvent with index 1..3
    if 'sidebar-tool-click' not in js:
        msgs.append('FAIL: No sidebar-tool-click CustomEvent dispatch found in bootstrap.js')
    if 'sidebarBtn1' not in js:
        msgs.append('FAIL: sidebarBtn1 not referenced in bootstrap.js handler wiring')
    # Check that index detail is sent
    if 'detail: { index: idx + 1' not in js.replace('\n',' '):
        msgs.append('WARN: sidebar-tool-click event does not include an index detail as expected')
    return msgs

def check_reset_logic(js: str) -> list[str]:
    msgs = []
    # Bulk guards around reset
    if 'beginActiveListBulk' not in js:
        msgs.append('FAIL: beginActiveListBulk not found in reset handler')
    if 'endActiveListBulk' not in js:
        msgs.append('FAIL: endActiveListBulk not found in reset handler')
    # Direct label removal and emphasis clear
    if 'removeLabel(' not in js or 'nameLabelMarkers' not in js:
        msgs.append('FAIL: Direct label removal via removeLabel/nameLabelMarkers not found')
    if 'emphasised' not in js:
        msgs.append('WARN: emphasised map not referenced during reset')
    # Final safety sweep (setTimeout)
    if 'setTimeout(() => {' not in js or 'removeLabel' not in js:
        msgs.append('WARN: Final post-reset sweep not detected')
    # DEFAULT_VIEW capture
    if 'const DEFAULT_VIEW' not in js:
        msgs.append('FAIL: DEFAULT_VIEW not captured for map reset')
    return msgs

def extract_default_view(js: str) -> tuple[list[str], list[str]]:
    # Find setView([lat,lon], zoom)
    m = re.search(r"setView\(\s*\[\s*([-0-9\.]+)\s*,\s*([-0-9\.]+)\s*\]\s*,\s*([0-9\.]+)\s*\)", js)
    if not m:
        return [], ['WARN: Could not determine default map view (setView)']
    lat, lon, zoom = m.group(1), m.group(2), m.group(3)
    return [f"INFO: Default map view setView([{lat},{lon}], {zoom})"], []

def check_show_all_defaults(html: str) -> list[str]:
    msgs = []
    # Expected defaults: SES/LGAs/CFA checked; Ambulance/Police unchecked
    def has_checked(id_):
        m = re.search(fr'<input[^>]*id="{id_}"[^>]*>', html)
        if not m:
            msgs.append(f'FAIL: {id_} not found')
            return None
        tag = m.group(0)
        return 'checked' in tag

    exp_checked = {
        'toggleAllSES': True,
        'toggleAllLGAs': True,
        'toggleAllCFA': True,
        'toggleAllAmbulance': False,
        'toggleAllPolice': False,
    }
    for id_, should in exp_checked.items():
        val = has_checked(id_)
        if val is None:
            continue
        if bool(val) != should:
            msgs.append(f"WARN: {id_} default checked={val} (expected {should})")
    return msgs

def main():
    ok = True
    html = read(INDEX)
    js = read(BOOTSTRAP)

    msgs = []
    msgs += check_recycle_button(html)
    msgs += check_dispatch_wiring(js)
    msgs += check_reset_logic(js)
    info_msgs, warn_msgs = extract_default_view(js)
    msgs += warn_msgs
    msgs += check_show_all_defaults(html)

    for m in info_msgs:
        print(m)
    for m in msgs:
        print(m)
        if m.startswith('FAIL'):
            ok = False
    if ok:
        print('PASS: Preflight for reset button readiness passed. You can implement the reset handler listening for sidebar-tool-click index=1.')
    else:
        print('FAIL: Preflight for reset button readiness failed. See messages above.')

if __name__ == '__main__':
    main()
