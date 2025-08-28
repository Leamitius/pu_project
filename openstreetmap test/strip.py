import json
import sys
from pathlib import Path

def strip_geojson(input_file, output_file):
    # Load GeoJSON
    with open(input_file, "r", encoding="utf-8") as f:
        geojson = json.load(f)

    # Extract only metadata (properties)
    features = geojson.get("features", [])
    metadata = [feature.get("properties", {}) for feature in features]

    # Write out to JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved {len(metadata)} features to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: python {Path(__file__).name} <input.geojson> <output.json>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    strip_geojson(input_file, output_file)
