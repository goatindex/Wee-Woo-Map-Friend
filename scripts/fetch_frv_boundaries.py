#!/usr/bin/env python3
"""
Fetch Fire Rescue Victoria (FRV) boundaries from ArcGIS REST service.
Downloads the data as GeoJSON format for use in the mapping application.
"""

import json
import requests
from urllib.parse import urlencode
import sys
import os

def fetch_frv_boundaries(output_file='geojson/frv.geojson'):
    """
    Fetch FRV boundaries from the ArcGIS REST service
    """
    base_url = "https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Fire_Authority_External/MapServer/0"
    
    print("Fetching Fire Rescue Victoria (FRV) boundaries...")
    print(f"Source: {base_url}")
    print()
    
    try:
        # First, get service info to understand the data
        info_params = {
            'f': 'json'
        }
        
        print("Getting service information...")
        info_response = requests.get(f"{base_url}", params=info_params, timeout=30)
        info_response.raise_for_status()
        
        service_info = info_response.json()
        print(f"Service Name: {service_info.get('name', 'Unknown')}")
        print(f"Description: {service_info.get('description', 'No description')}")
        print(f"Geometry Type: {service_info.get('geometryType', 'Unknown')}")
        
        if 'fields' in service_info:
            print(f"Available fields: {', '.join([f['name'] for f in service_info['fields']])}")
        print()
        
        # Query all features
        query_url = f"{base_url}/query"
        
        # Parameters for querying all features as GeoJSON
        query_params = {
            'where': '1=1',  # Get all features
            'outFields': '*',  # Get all fields
            'f': 'geojson',  # Return as GeoJSON
            'returnGeometry': 'true',
            'spatialRel': 'esriSpatialRelIntersects'
        }
        
        print("Fetching FRV boundary data...")
        print("This may take a moment depending on data size...")
        
        query_response = requests.get(query_url, params=query_params, timeout=60)
        query_response.raise_for_status()
        
        # Parse the GeoJSON response
        geojson_data = query_response.json()
        
        # Validate it's proper GeoJSON
        if geojson_data.get('type') != 'FeatureCollection':
            raise ValueError(f"Invalid GeoJSON response: {geojson_data.get('type')}")
        
        features = geojson_data.get('features', [])
        if not features:
            print("WARNING: No features found in the response")
            return False
        
        print(f"✓ Successfully fetched {len(features)} FRV boundary features")
        
        # Display some info about the features
        if features:
            first_feature = features[0]
            if 'properties' in first_feature:
                print(f"Sample properties: {list(first_feature['properties'].keys())}")
            
            geometry_types = set()
            for feature in features:
                if 'geometry' in feature and feature['geometry']:
                    geometry_types.add(feature['geometry'].get('type'))
            print(f"Geometry types: {', '.join(geometry_types)}")
        
        # Save to file
        print(f"\nSaving to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, indent=2, ensure_ascii=False)
        
        # Get file size
        file_size = os.path.getsize(output_file)
        file_size_mb = file_size / (1024 * 1024)
        
        print(f"✅ Successfully saved FRV boundaries!")
        print(f"File: {output_file}")
        print(f"Size: {file_size_mb:.2f} MB")
        print(f"Features: {len(features)}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    print("Fire Rescue Victoria (FRV) Boundary Fetcher")
    print("==========================================")
    
    # Allow custom output filename
    output_file = sys.argv[1] if len(sys.argv) > 1 else 'geojson/frv.geojson'
    
    success = fetch_frv_boundaries(output_file)
    
    if success:
        print(f"\n🎉 FRV boundaries successfully downloaded!")
        print(f"You can now use {output_file} in your mapping application.")
        print(f"\nNext steps:")
        print(f"1. Add FRV to your category configuration")
        print(f"2. Create styling for FRV boundaries")  
        print(f"3. Add FRV to the sidebar and preloader")
    else:
        print(f"\n💥 Failed to download FRV boundaries")
        print(f"Check your internet connection and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
