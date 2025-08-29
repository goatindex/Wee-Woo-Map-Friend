# Backend API Endpoints

> **HTTP API reference for WeeWoo Map Friend backend services**

## 📋 Overview

The WeeWoo Map Friend backend provides REST API endpoints for weather data integration and service health monitoring. All endpoints return JSON responses with standardized error handling.

### **Base URLs**

| Environment | Base URL | Notes |
|-------------|----------|--------|
| **Development** | `http://127.0.0.1:5000` | Local Flask development server |
| **Production** | `https://your-domain.com` | HTTPS required for production |

### **Content Types**

- **Request**: `application/json` or URL parameters
- **Response**: `application/json`
- **Character Encoding**: UTF-8

## 🔗 Endpoints

### **Health Check**

Monitor backend service status and connectivity.

```http
GET /health
```

#### **Response** 

**Success (200 OK):**
```json
{
  "status": "ok"
}
```

#### **Usage Example**
```javascript
const checkHealth = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/health');
    const data = await response.json();
    console.log('Backend status:', data.status);
  } catch (error) {
    console.error('Backend unavailable:', error);
  }
};
```

---

### **Weather Data**

Retrieve 7-day weather forecasts with multi-provider support and automatic fallback.

```http
GET /api/weather?lat={latitude}&lon={longitude}&days={days}&provider={provider}
```

#### **Parameters**

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `lat` | number | ✅ **Required** | Latitude (-90 to 90) | - | `-37.8136` |
| `lon` | number | ✅ **Required** | Longitude (-180 to 180) | - | `144.9631` |
| `days` | integer | ⭕ Optional | Forecast days (1-7) | `7` | `7` |
| `provider` | string | ⭕ Optional | Weather provider | `mock` | `willyweather` |

#### **Supported Providers**

| Provider | Description | Rate Limits | Coverage |
|----------|-------------|-------------|----------|
| `mock` | Development mock data | Unlimited | Global |
| `open-meteo` | Open-Meteo free API | 10,000 requests/day | Global |
| `willyweather` | WillyWeather premium API | API key dependent | Australia focus |

#### **Response**

**Success (200 OK):**
```json
{
  "location": {
    "lat": -37.8136,
    "lon": 144.9631
  },
  "days": 7,
  "forecast": [
    {
      "day": 1,
      "summary": "Partly cloudy with light winds",
      "tempMin": 12,
      "tempMax": 22
    },
    {
      "day": 2,
      "summary": "Overcast with possible showers",
      "tempMin": 14,
      "tempMax": 19
    }
  ]
}
```

#### **Error Responses**

**Bad Request (400):**
```json
{
  "error": "Invalid parameters",
  "message": "Latitude must be between -90 and 90"
}
```

**Not Found (404):**
```json
{
  "error": "Location not found",
  "message": "No weather data available for coordinates"
}
```

**Bad Gateway (502):**
```json
{
  "error": "Upstream API error",
  "message": "Weather provider service unavailable"
}
```

**Gateway Timeout (504):**
```json
{
  "error": "Request timeout",
  "message": "Weather provider did not respond within timeout period"
}
```

#### **Usage Examples**

**Basic Weather Request:**
```javascript
const getWeather = async (lat, lon) => {
  const response = await fetch(
    `http://127.0.0.1:5000/api/weather?lat=${lat}&lon=${lon}&days=7`
  );
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }
  
  return await response.json();
};

// Melbourne weather
const weather = await getWeather(-37.8136, 144.9631);
console.log(weather.forecast);
```

**Provider Selection:**
```javascript
const getWeatherWithProvider = async (lat, lon, provider = 'willyweather') => {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/api/weather?lat=${lat}&lon=${lon}&provider=${provider}`
    );
    return await response.json();
  } catch (error) {
    // Fallback to Open-Meteo if WillyWeather fails
    if (provider === 'willyweather') {
      console.warn('WillyWeather failed, falling back to Open-Meteo');
      return getWeatherWithProvider(lat, lon, 'open-meteo');
    }
    throw error;
  }
};
```

**Integration with Map Layers:**
```javascript
// From ActiveListManager.js
const fetchWeatherData = async (lat, lon) => {
  const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5000'
    : '';
  
  const makeUrl = (provider) => 
    `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(provider)}`;
  
  let data;
  try {
    const res = await fetch(makeUrl('willyweather'));
    if (!res.ok) throw new Error(`Weather API error ${res.status}`);
    data = await res.json();
  } catch (e) {
    // Automatic fallback to Open-Meteo
    const res2 = await fetch(makeUrl('open-meteo'));
    if (!res2.ok) throw new Error(`Weather API error ${res2.status}`);
    data = await res2.json();
  }
  
  return data;
};
```

## 🔧 Configuration

### **Environment Variables**

The backend requires these environment variables in `backend/.env`:

```bash
# Weather Provider Configuration
WILLYWEATHER_API_KEY=your_api_key_here
WEATHER_PROVIDER=willyweather  # mock, open-meteo, willyweather
USE_MOCK=0                     # Set to 1 for development

# CORS Configuration  
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

# Performance Settings
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
```

### **CORS Policy**

The backend implements CORS (Cross-Origin Resource Sharing) restrictions:

- **Development**: Allows `localhost` and `127.0.0.1`
- **Production**: Configure `ALLOWED_ORIGINS` for your domains
- **Preflight**: Supports OPTIONS requests for complex requests

### **Error Handling**

All endpoints follow consistent error response patterns:

```json
{
  "error": "error_type",
  "message": "Human-readable error description",
  "details": {
    "parameter": "Additional error context"
  }
}
```

### **Rate Limiting**

- **No explicit rate limiting** on backend endpoints
- **Provider limits apply** - respect upstream API constraints
- **Caching** - 5-minute cache TTL reduces provider requests
- **Timeout** - 5-second request timeout prevents hanging

## 🚀 Development

### **Starting the Backend**

```bash
# Set up Python environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Start development server
python backend/app.py
```

### **Testing Endpoints**

```bash
# Health check
curl http://127.0.0.1:5000/health

# Weather data
curl "http://127.0.0.1:5000/api/weather?lat=-37.8136&lon=144.9631&days=7&provider=mock"

# Test error handling
curl "http://127.0.0.1:5000/api/weather?lat=invalid&lon=144.9631"
```

### **Production Deployment**

1. **HTTPS Required** - PWA and geolocation features require secure context
2. **Environment Variables** - Use production API keys and allowed origins  
3. **Process Management** - Use gunicorn, uwsgi, or similar WSGI server
4. **Reverse Proxy** - Configure nginx or Apache for static file serving
5. **Monitoring** - Set up health check monitoring and alerting

## 🔗 Related Documentation

- **[Authentication](authentication.md)** - API security and access control
- **[Rate Limits](rate-limits.md)** - Performance constraints and optimization
- **[Error Handling](error-handling.md)** - Comprehensive error pattern documentation
- **[Examples](examples.md)** - Frontend integration examples

---

**Next**: Learn about [data formats and schemas](data-formats.md) for frontend API integration.