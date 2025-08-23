"""Extract LGA names from LGAs.geojson into LGAnames.txt.

Run from repo root or any path; uses script directory to locate files.
"""
import os
import json

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Specify the relative path to your GeoJSON file
geojson_file_path = os.path.join(script_dir, 'LGAs.geojson')

# Read the GeoJSON file
with open(geojson_file_path, 'r') as file:
    geojson_data = json.load(file)

# Extract LGA names
lga_names = [feature['properties']['LGA_NAME'] for feature in geojson_data['features']]

# Write the list of LGA names to LGAnames.txt
output_file_path = os.path.join(script_dir, 'LGAnames.txt')
with open(output_file_path, 'w', encoding='utf-8') as out_file:
    for lga_name in lga_names:
        out_file.write(f"{lga_name}\n")
