import json

# Input files
geojson_file = "C:\Mael Strasser\Kanti\PU\openstreetmap test\geoBoundariesCGAZ_ADM1.geojson"
countries_file = "countries.txt"
output_file = "C:\Mael Strasser\Kanti\PU\openstreetmap test/filteredadm1.geojson"

# Load allowed countries
allowed_countries = set()
with open(countries_file, "r", encoding="utf-8") as f:
    for line in f:
        code = line.split(":")[0].strip()
        if code:
            allowed_countries.add(code)

print(f"Keeping {len(allowed_countries)} countries: {allowed_countries}")

# Load GeoJSON
with open(geojson_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Filter features
filtered_features = [
    feature for feature in data["features"]
    if feature.get("properties", {}).get("shapeGroup") in allowed_countries
]

# Create filtered GeoJSON structure
filtered_geojson = {
    "type": data["type"],
    "features": filtered_features
}

# Save compact JSON (no pretty-print)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(filtered_geojson, f, ensure_ascii=False, separators=(",", ":"))

print(f"Filtered GeoJSON saved to {output_file} with {len(filtered_features)} features.")
