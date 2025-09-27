from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

API_KEY = os.getenv("API_KEY")
BASE_URL = os.getenv("BASE_URL")

app = Flask(__name__)
CORS(app)

def transform_record(r):
    """Transform raw API record to JSON with proper float handling."""
    try:
        lat = float(r.get("latitude")) if r.get("latitude") else None
        lon = float(r.get("longitude")) if r.get("longitude") else None
    except:
        lat, lon = None, None

    def parse_val(v):
        return None if v in ["NA", None, ""] else float(v)

    return {
        "city": r.get("city"),
        "state": r.get("state"),
        "station": r.get("station"),
        "last_update": r.get("last_update"),
        "pollutant_id": r.get("pollutant_id"),
        "pollutant_avg": parse_val(r.get("avg_value")),
        "pollutant_min": parse_val(r.get("min_value")),
        "pollutant_max": parse_val(r.get("max_value")),
        "latitude": lat,
        "longitude": lon
    }

@app.route("/airquality", methods=["GET"])
def get_air_quality():
    """Fetch air quality for a specific city."""
    city = request.args.get("city")
    if not city:
        return jsonify({"records": [], "error": "City parameter is required"}), 400

    params = {
        "api-key": API_KEY,
        "format": "json",
        "filters[city]": city,
        "limit": 50
    }

    try:
        response = requests.get(BASE_URL, params=params)
        data = response.json()
    except Exception as e:
        return jsonify({"records": [], "error": str(e)})

    records = [transform_record(r) for r in data.get("records", [])]
    return jsonify({"records": records})

@app.route("/airquality/all", methods=["GET"])
def get_air_quality_all():
    """Fetch all available air quality stations."""
    params = {
        "api-key": API_KEY,
        "format": "json",
        "limit": 500
    }

    try:
        response = requests.get(BASE_URL, params=params)
        data = response.json()
    except Exception as e:
        return jsonify({"records": [], "error": str(e)})

    records = [transform_record(r) for r in data.get("records", [])]
    return jsonify({"records": records})

if __name__ == "__main__":
    app.run(debug=True)
