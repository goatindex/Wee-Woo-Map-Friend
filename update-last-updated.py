"""Write the last Git commit date (AEST) to last-updated.txt.

Usage: run from repo root; requires Git available on PATH.
"""
#!/usr/bin/env python3
import subprocess
from datetime import datetime, timedelta
import locale

# Set locale to Australian English for day/month names
try:
    locale.setlocale(locale.LC_TIME, 'en_AU.UTF-8')
except locale.Error:
    locale.setlocale(locale.LC_TIME, 'en_US.UTF-8')

git_cmd = [
    'git', 'log', '-1', '--format=%cI'
]
iso_date = subprocess.check_output(git_cmd).decode().strip()
# Parse ISO date and convert to AEST (UTC+10)
dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00')) + timedelta(hours=10)
formatted = dt.strftime('%A, %B %d, %Y %-I:%M %p (AEST)')

with open('last-updated.txt', 'w') as f:
    f.write(formatted)
