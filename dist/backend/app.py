"""Flask backend proxy for weather providers.

Exposes:
    - GET /health: simple readiness endpoint.
    - GET /api/weather: normalized 7‑day forecast from mock, Open‑Meteo, or WillyWeather.

Environment variables (see README and backend/.env.example):
    WILLYWEATHER_API_KEY, ALLOWED_ORIGINS, USE_MOCK, CACHE_TTL_SECONDS,
    REQUEST_TIMEOUT, WEATHER_PROVIDER
"""
import os
import json
import time
from typing import Dict, Tuple, List, Optional

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # dotenv is optional in prod
    pass

app = Flask(__name__)

# Config
WILLYWEATHER_API_KEY = os.getenv('WILLYWEATHER_API_KEY', '').strip()
ALLOWED_ORIGINS = [o.strip() for o in os.getenv('ALLOWED_ORIGINS', 'http://localhost:8000').split(',') if o.strip()]
USE_MOCK = os.getenv('USE_MOCK', '1') in ('1', 'true', 'True')
CACHE_TTL_SECONDS = int(os.getenv('CACHE_TTL_SECONDS', '300'))
REQUEST_TIMEOUT = float(os.getenv('REQUEST_TIMEOUT', '5'))
WEATHER_PROVIDER = os.getenv('WEATHER_PROVIDER', 'mock').strip().lower()

CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

# Simple in-memory cache: key -> (expires_at, data)
CacheType = Dict[str, Tuple[float, dict]]
cache: CacheType = {}


@app.get('/health')
def health():
    """Health endpoint returning {"status": "ok"}."""
    return jsonify({"status": "ok"})


def cache_get(key: str):
    """Return cached data for key if not expired; otherwise None."""
    item = cache.get(key)
    if not item:
        return None
    exp, data = item
    if exp < time.time():
        cache.pop(key, None)
        return None
    return data


def cache_set(key: str, data: dict, ttl: int = CACHE_TTL_SECONDS):
    """Store data in cache with TTL seconds."""
    cache[key] = (time.time() + ttl, data)


def normalize_forecast(days: List[dict]) -> dict:
    """Ensure uniform structure for frontend consumption.

    Args:
        days: List of day objects containing summary/tempMin/tempMax.
    Returns:
        Dict with key "forecast" -> list of normalized day objects.
    """
    return {
        "forecast": [
            {
                "day": i + 1,
                "summary": d.get("summary", "—"),
                "tempMin": d.get("tempMin"),
                "tempMax": d.get("tempMax"),
            }
            for i, d in enumerate(days)
        ]
    }


def map_open_meteo_code(code: int) -> str:
    # Minimal mapping per Open-Meteo weather codes
    groups = {
        (0,): "Clear sky",
        (1,): "Mainly clear",
        (2,): "Partly cloudy",
        (3,): "Overcast",
        (45, 48): "Fog",
        (51, 53, 55): "Drizzle",
        (56, 57): "Freezing drizzle",
        (61, 63, 65): "Rain",
        (66, 67): "Freezing rain",
        (71, 73, 75, 77): "Snow",
        (80, 81, 82): "Rain showers",
        (85, 86): "Snow showers",
        (95,): "Thunderstorm",
        (96, 97, 99): "Thunderstorm w/ hail",
    }
    for keys, label in groups.items():
        if code in keys:
            return label
    return f"Code {code}"


def open_meteo_forecast(lat: float, lon: float, days: int) -> dict:
    """Fetch and normalize daily forecast from Open‑Meteo."""
    # Open-Meteo free endpoint, no key required.
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_min,temperature_2m_max,weathercode",
        "timezone": "auto",
        "forecast_days": days,
    }
    res = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
    res.raise_for_status()
    j = res.json()
    daily = j.get("daily", {})
    times = daily.get("time", [])
    tmins = daily.get("temperature_2m_min", [])
    tmaxs = daily.get("temperature_2m_max", [])
    codes = daily.get("weathercode", [])
    out_days = []
    for i in range(min(len(times), days)):
        summary = map_open_meteo_code(int(codes[i])) if i < len(codes) else "—"
        temp_min = float(tmins[i]) if i < len(tmins) else None
        temp_max = float(tmaxs[i]) if i < len(tmaxs) else None
        out_days.append({
            "date": times[i],
            "summary": summary,
            "tempMin": temp_min,
            "tempMax": temp_max,
        })
    return normalize_forecast(out_days)


def willyweather_find_location_id(lat: float, lon: float) -> Optional[int]:
    """Find closest WillyWeather location id for coordinates.

    Docs: https://www.willyweather.com.au/api/docs/search.html#location-get-search-by-coordinates
    Requires sending a GET with header `x-payload` as JSON.
    """
    if not WILLYWEATHER_API_KEY:
        raise ValueError("WILLYWEATHER_API_KEY missing")
    url = f"https://api.willyweather.com.au/v2/{WILLYWEATHER_API_KEY}/search.json"
    headers = {
        "Content-Type": "application/json",
        "x-payload": json.dumps({
            "lat": lat,
            "lng": lon,
            # small radius in km to bias to nearest general location; API defaults are acceptable
            "range": 10,
            "units": {"distance": "km"}
        })
    }
    res = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
    res.raise_for_status()
    data = res.json()
    # Response shape: { "location": { id, ... }, "units": { distance: "km" } }
    loc = data.get("location") if isinstance(data, dict) else None
    if loc and isinstance(loc, dict):
        return int(loc.get("id"))
    return None


def willyweather_forecast_by_id(location_id: int, days: int) -> dict:
    """Fetch WillyWeather daily weather forecast for a given location id.

    Docs: https://www.willyweather.com.au/api/docs/weather.html#forecast-get-weather
    Endpoint: GET /v2/{api key}/locations/{location id}/weather.json with x-payload header.
    """
    if not WILLYWEATHER_API_KEY:
        raise ValueError("WILLYWEATHER_API_KEY missing")
    url = f"https://api.willyweather.com.au/v2/{WILLYWEATHER_API_KEY}/locations/{location_id}/weather.json"
    headers = {
        "Content-Type": "application/json",
        "x-payload": json.dumps({
            "forecasts": ["weather"],
            "days": int(days)
        })
    }
    res = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
    res.raise_for_status()
    j = res.json() or {}
    forecasts = (j.get("forecasts") or {}).get("weather") or {}
    days_arr = forecasts.get("days") or []
    out_days: List[dict] = []
    for d in days_arr:
        entries = d.get("entries") or []
        # Prefer daytime entry where night == False; otherwise first entry
        chosen = None
        for e in entries:
            if not e.get("night", False):
                chosen = e
                break
        if not chosen and entries:
            chosen = entries[0]
        if chosen:
            out_days.append({
                "summary": chosen.get("precis") or "—",
                "tempMin": chosen.get("min"),
                "tempMax": chosen.get("max"),
            })
    # If API returns fewer days than requested, that's fine.
    return normalize_forecast(out_days[:days])


@app.get('/api/weather')
def weather():
    """Proxy endpoint for normalized weather data.

    Query params:
        lat, lon (required), days (optional, default 7), provider (optional)

    Responses:
        200: JSON with { location, days, forecast: [...] }
        400: Invalid input or unknown provider
        404: WillyWeather location not found
        5xx: Upstream errors/timeouts
    """
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    days = int(request.args.get('days', '7'))
    provider = (request.args.get('provider') or WEATHER_PROVIDER).strip().lower()

    if not lat or not lon:
        return jsonify({"error": "lat and lon are required"}), 400

    cache_key = f"weather:{provider}:{lat}:{lon}:{days}"
    cached = cache_get(cache_key)
    if cached:
        return jsonify({"source": "cache", **cached})

    # Mock mode for local dev without exposing keys or hitting quotas
    # Allow query param 'provider=open-meteo' to bypass global USE_MOCK
    if provider == 'mock' or (provider == WEATHER_PROVIDER and USE_MOCK):
        data = {
            "location": {"lat": float(lat), "lon": float(lon)},
            "days": days,
            "mock": True,
            "forecast": [
                {"day": i + 1, "summary": "Partly cloudy", "tempMin": 10 + i, "tempMax": 18 + i}
                for i in range(days)
            ]
        }
        cache_set(cache_key, data)
        return jsonify(data)

    # Provider-based upstream calls
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except ValueError:
        return jsonify({"error": "Invalid lat/lon"}), 400

    try:
        if provider == 'open-meteo':
            normalized = open_meteo_forecast(lat_f, lon_f, days)
            data = {"location": {"lat": float(lat), "lon": float(lon)}, "days": days, **normalized}
            cache_set(cache_key, data)
            return jsonify(data)
        elif provider == 'willyweather':
            # 1) Find nearest location id to coordinates
            loc_id = willyweather_find_location_id(lat_f, lon_f)
            if not loc_id:
                return jsonify({"error": "No WillyWeather location found for coordinates"}), 404
            # 2) Fetch daily weather forecast for that id
            normalized = willyweather_forecast_by_id(loc_id, days)
            data = {
                "location": {"lat": float(lat), "lon": float(lon), "willyWeatherLocationId": loc_id},
                "days": days,
                **normalized
            }
            cache_set(cache_key, data)
            return jsonify(data)
        else:
            return jsonify({"error": f"Unknown provider '{provider}'"}), 400
    except requests.Timeout:
        return jsonify({"error": "Upstream timeout"}), 504
    except requests.HTTPError as he:
        status = getattr(he.response, 'status_code', 502)
        return jsonify({"error": "Upstream error", "status": status}), 502
    except Exception as e:
        return jsonify({"error": "Upstream failure", "detail": str(e)}), 502


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
