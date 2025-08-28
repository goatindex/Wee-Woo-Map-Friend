#!/usr/bin/env python3
"""
Add latitude and longitude coordinates to CFA brigade data using geocoding.
Uses Brigade Address + Suburb to obtain coordinates for label anchoring.
Outputs detailed error reporting by line and Brigade Name.
"""

import json
import time
import sys
from typing import Dict, List, Tuple, Optional
import requests
from urllib.parse import quote

class CFACoordinateAdder:
    def __init__(self, input_file: str, output_file: str):
        self.input_file = input_file
        self.output_file = output_file
        self.errors: List[Dict] = []
        self.success_count = 0
        self.total_count = 0
        
    def clean_address(self, address: str, suburb: str) -> str:
        """Clean and format address for geocoding"""
        # Remove extra spaces and clean up
        address = address.strip()
        suburb = suburb.strip()
        
        # Remove leading/trailing special characters
        address = address.strip(' ,.-')
        
        # Create full address string
        full_address = f"{address}, {suburb}, Victoria, Australia"
        return full_address
    
    def geocode_address(self, address: str, suburb: str, brigade_name: str, line_num: int) -> Optional[Tuple[float, float]]:
        """
        Geocode an address using OpenStreetMap Nominatim (free, no API key required)
        Returns (lat, lng) tuple or None if geocoding fails
        """
        try:
            full_address = self.clean_address(address, suburb)
            
            # Use Nominatim (OpenStreetMap) for geocoding - free and reliable
            url = f"https://nominatim.openstreetmap.org/search"
            params = {
                'q': full_address,
                'format': 'json',
                'limit': 1,
                'countrycodes': 'au',  # Restrict to Australia
                'addressdetails': 1
            }
            
            # Be respectful to the service
            headers = {
                'User-Agent': 'CFA-Coordinate-Adder/1.0 (mapexp.github.io)'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            results = response.json()
            
            if results and len(results) > 0:
                result = results[0]
                lat = float(result['lat'])
                lng = float(result['lon'])
                
                # Validate coordinates are in Victoria (rough bounds check)
                if -39.5 <= lat <= -34.0 and 140.0 <= lng <= 150.0:
                    return (lat, lng)
                else:
                    self.errors.append({
                        'line': line_num,
                        'brigade_name': brigade_name,
                        'address': full_address,
                        'error': f'Coordinates outside Victoria bounds: {lat}, {lng}',
                        'type': 'bounds_error'
                    })
                    return None
            else:
                self.errors.append({
                    'line': line_num,
                    'brigade_name': brigade_name,
                    'address': full_address,
                    'error': 'No geocoding results found',
                    'type': 'no_results'
                })
                return None
                
        except requests.exceptions.RequestException as e:
            self.errors.append({
                'line': line_num,
                'brigade_name': brigade_name,
                'address': f"{address}, {suburb}",
                'error': f'Network error: {str(e)}',
                'type': 'network_error'
            })
            return None
        except (ValueError, KeyError) as e:
            self.errors.append({
                'line': line_num,
                'brigade_name': brigade_name,
                'address': f"{address}, {suburb}",
                'error': f'Parsing error: {str(e)}',
                'type': 'parsing_error'
            })
            return None
        except Exception as e:
            self.errors.append({
                'line': line_num,
                'brigade_name': brigade_name,
                'address': f"{address}, {suburb}",
                'error': f'Unexpected error: {str(e)}',
                'type': 'unknown_error'
            })
            return None
    
    def process_file(self) -> bool:
        """Process the CFA file and add coordinates"""
        try:
            print(f"Loading {self.input_file}...")
            with open(self.input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Validate structure
            if 'fields' not in data or 'records' not in data:
                print("ERROR: Invalid file structure - missing 'fields' or 'records'")
                return False
            
            # Find field indices
            fields = [field['id'] for field in data['fields']]
            try:
                brigade_name_idx = fields.index('Brigade Name')
                brigade_address_idx = fields.index('Brigade Address')
                suburb_idx = fields.index('Suburb')
            except ValueError as e:
                print(f"ERROR: Required field not found: {e}")
                return False
            
            # Add lat/lng fields if they don't exist
            lat_idx = None
            lng_idx = None
            
            if 'lat' not in fields:
                data['fields'].append({'id': 'lat', 'type': 'float'})
                lat_idx = len(fields)
                fields.append('lat')
            else:
                lat_idx = fields.index('lat')
                
            if 'lng' not in fields:
                data['fields'].append({'id': 'lng', 'type': 'float'})
                lng_idx = len(fields)
                fields.append('lng')
            else:
                lng_idx = fields.index('lng')
            
            print(f"Processing {len(data['records'])} CFA brigade records...")
            print("This may take several minutes due to geocoding rate limits...")
            
            # Process each record
            for i, record in enumerate(data['records']):
                self.total_count += 1
                line_num = i + 3  # Account for header lines in JSON
                
                # Extend record if needed for new fields
                while len(record) <= max(lat_idx, lng_idx):
                    record.append(None)
                
                # Skip if coordinates already exist
                if (record[lat_idx] is not None and record[lng_idx] is not None and 
                    record[lat_idx] != "" and record[lng_idx] != ""):
                    self.success_count += 1
                    continue
                
                brigade_name = record[brigade_name_idx] if len(record) > brigade_name_idx else ""
                brigade_address = record[brigade_address_idx] if len(record) > brigade_address_idx else ""
                suburb = record[suburb_idx] if len(record) > suburb_idx else ""
                
                print(f"  [{i+1}/{len(data['records'])}] Processing: {brigade_name}")
                
                # Validate required fields
                if not brigade_address or not suburb:
                    self.errors.append({
                        'line': line_num,
                        'brigade_name': brigade_name,
                        'address': f"{brigade_address}, {suburb}",
                        'error': 'Missing address or suburb information',
                        'type': 'missing_data'
                    })
                    continue
                
                # Geocode the address
                coords = self.geocode_address(brigade_address, suburb, brigade_name, line_num)
                
                if coords:
                    lat, lng = coords
                    record[lat_idx] = round(lat, 6)  # Match SES precision (6 decimal places)
                    record[lng_idx] = round(lng, 6)
                    self.success_count += 1
                    print(f"    ✓ Found: {lat:.6f}, {lng:.6f}")
                else:
                    print(f"    ✗ Failed to geocode")
                
                # Rate limiting - be respectful to free service
                time.sleep(1.1)  # Nominatim requests max 1 request per second
            
            # Save the updated file
            print(f"\nSaving updated data to {self.output_file}...")
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            return True
            
        except FileNotFoundError:
            print(f"ERROR: File {self.input_file} not found")
            return False
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in {self.input_file}: {e}")
            return False
        except Exception as e:
            print(f"ERROR: Unexpected error: {e}")
            return False
    
    def generate_error_report(self) -> str:
        """Generate detailed error report"""
        if not self.errors:
            return "No errors encountered! 🎉"
        
        report = f"\n{'='*60}\n"
        report += f"CFA COORDINATE PROCESSING ERROR REPORT\n"
        report += f"{'='*60}\n"
        report += f"Total Records: {self.total_count}\n"
        report += f"Successful: {self.success_count}\n"
        report += f"Errors: {len(self.errors)}\n"
        report += f"Success Rate: {(self.success_count/self.total_count*100):.1f}%\n"
        report += f"{'='*60}\n\n"
        
        # Group errors by type
        error_types = {}
        for error in self.errors:
            error_type = error['type']
            if error_type not in error_types:
                error_types[error_type] = []
            error_types[error_type].append(error)
        
        for error_type, error_list in error_types.items():
            report += f"{error_type.replace('_', ' ').title()} ({len(error_list)} errors):\n"
            report += f"{'-' * 40}\n"
            
            for error in error_list:
                report += f"Line {error['line']}: {error['brigade_name']}\n"
                report += f"  Address: {error['address']}\n"
                report += f"  Error: {error['error']}\n\n"
        
        return report

def main():
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = "cfabld.json"
    
    output_file = input_file.replace('.json', '_with_coords.json')
    
    print("CFA Coordinate Adder")
    print("==================")
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    print(f"Using OpenStreetMap Nominatim for geocoding (free service)")
    print()
    
    adder = CFACoordinateAdder(input_file, output_file)
    
    if adder.process_file():
        print(f"\n✅ Processing complete!")
        print(f"Results saved to: {output_file}")
        
        # Generate and display error report
        error_report = adder.generate_error_report()
        print(error_report)
        
        # Save error report to file
        error_file = output_file.replace('.json', '_errors.txt')
        with open(error_file, 'w', encoding='utf-8') as f:
            f.write(error_report)
        print(f"Error report saved to: {error_file}")
        
    else:
        print("❌ Processing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
