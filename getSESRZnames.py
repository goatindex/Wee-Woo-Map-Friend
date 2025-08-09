import os
import json

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Specify the relative path to your GeoJSON file
geojson_file_path = os.path.join(script_dir, 'ses.geojson')

# Read the GeoJSON file
with open(geojson_file_path, 'r') as file:
    geojson_data = json.load(file)

# Extract LGA names
response_zone_names = [feature['properties']['RESPONSE_ZONE_NAME'] for feature in geojson_data['features']]

# Print the list of LGA names
for response_zone in response_zone_names:
    print(response_zone)
