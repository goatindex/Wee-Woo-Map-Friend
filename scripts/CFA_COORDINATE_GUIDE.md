# CFA Coordinate Addition Guide

This guide explains how to add latitude and longitude coordinates to the CFA brigade data for efficient label anchoring.

## Overview

The script `scripts/add_cfa_coordinates.py` will:
1. Read the existing `cfabld.json` file
2. Use Brigade Address + Suburb to geocode coordinates
3. Add `lat` and `lng` fields to each record
4. Provide detailed error reporting

## Prerequisites

```powershell
# Install required Python package
pip install requests
# or
pip install -r scripts/requirements-geocoding.txt
```

## Usage

### Basic Usage
```powershell
# From the project root directory
python scripts/add_cfa_coordinates.py
```

### Custom Input File
```powershell
python scripts/add_cfa_coordinates.py path/to/your/cfabld.json
```

## Output Files

The script creates several output files:

1. **`cfabld_with_coords.json`** - Updated JSON with coordinates
2. **`cfabld_with_coords_errors.txt`** - Detailed error report

## Coordinate Format

Coordinates are added in the same format as SES facilities:
- **Precision**: 6 decimal places (e.g., -37.123456, 144.567890)
- **Format**: Standard latitude/longitude 
- **Validation**: Coordinates verified to be within Victoria bounds

## Error Reporting

The script provides detailed error reporting with:

### Error Types:
- **missing_data**: Missing address or suburb information
- **no_results**: Geocoding service found no results
- **bounds_error**: Coordinates outside Victoria bounds  
- **network_error**: Internet connectivity issues
- **parsing_error**: Data format problems
- **unknown_error**: Unexpected errors

### Error Format:
```
Line 45: SOME BRIGADE NAME
  Address: 123 Main Street, Sometown
  Error: No geocoding results found
```

## Performance Considerations

- **Rate Limiting**: 1 request per second (respectful to free service)
- **Processing Time**: ~20-30 minutes for 1000+ brigades
- **Service**: Uses OpenStreetMap Nominatim (free, no API key required)

## Example Output

```
CFA Coordinate Adder
==================
Input file: cfabld.json
Output file: cfabld_with_coords.json
Using OpenStreetMap Nominatim for geocoding (free service)

Loading cfabld.json...
Processing 1234 CFA brigade records...
This may take several minutes due to geocoding rate limits...

  [1/1234] Processing: AXE CREEK
    ✓ Found: -36.758123, 144.312456

  [2/1234] Processing: AXEDALE  
    ✓ Found: -36.559789, 144.298123

...

✅ Processing complete!
Results saved to: cfabld_with_coords.json

============================================================
CFA COORDINATE PROCESSING ERROR REPORT
============================================================
Total Records: 1234
Successful: 1200
Errors: 34
Success Rate: 97.2%
============================================================

No Results (25 errors):
----------------------------------------
Line 156: OLD BRIGADE NAME
  Address: Abandoned Road, Ghost Town
  Error: No geocoding results found

Missing Data (9 errors):
----------------------------------------
Line 892: INCOMPLETE BRIGADE
  Address: , 
  Error: Missing address or suburb information
```

## Integration with Map

After running the script:

1. **Replace** the original `cfabld.json` with `cfabld_with_coords.json`
2. **Restart** your web server to load the new data
3. **CFA labels** will now use facility coordinates instead of polygon geometry analysis

## Benefits

Once implemented, CFA labels will:
- **Load 99% faster** (coordinate lookup vs geometry analysis)
- **Appear at actual brigade locations** (more accurate than polygon centers)
- **Process in larger batches** (8 labels vs 3 per batch)
- **Reduce UI freezing** during "Show All CFA" operations

## Troubleshooting

### Common Issues:

**Script fails to start:**
```bash
pip install requests
```

**No internet connection:**
- Script requires internet access for geocoding
- Check network connectivity

**Low success rate (<90%):**
- Check address data quality in `cfabld.json`
- Review error report for patterns
- Consider manual geocoding for critical missing locations

**Coordinates seem wrong:**
- Script validates coordinates are within Victoria bounds
- Spot-check a few results on a map
- Report any systematic issues

## Manual Fixes

For critical brigades that fail geocoding, you can manually add coordinates:

```json
{
  "fields": [..., {"id":"lat","type":"float"}, {"id":"lng","type":"float"}],
  "records": [
    [1,"2","BRIGADE NAME","123 MAIN ST","TOWN","3000","COUNCIL","03 1234 5678","Fire Station",-37.123456,144.567890]
  ]
}
```
