import json
import pycountry

# Path to your GeoJSON file
geojson_file = "C:\Mael Strasser\Kanti\PU\openstreetmap test\geoBoundariesCGAZ_ADM2.geojson"
output_file = "countries.txt"

# Load the GeoJSON file
with open(geojson_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract all unique ISO3 country codes
country_codes = set()
for feature in data["features"]:
    shape_group = feature.get("properties", {}).get("shapeGroup")
    if shape_group:
        country_codes.add(shape_group)

# Translate ISO3 codes to names
def iso3_to_name(code):
    try:
        country = pycountry.countries.get(alpha_3=code)
        return country.name if country else "Unknown"
    except:
        return "Unknown"

countries = sorted([(code, iso3_to_name(code)) for code in country_codes])

# Save to file
with open(output_file, "w", encoding="utf-8") as f:
    for code, name in countries:
        f.write(f"{code}: {name}\n")

print(f"Saved {len(countries)} countries to {output_file}")
