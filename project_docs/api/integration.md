# Integration Guide

Comprehensive guide to third-party services, data sources, and external API integrations for WeeWoo Map Friend.

## 📋 **Table of Contents**

- [Weather Providers](#weather-providers)
- [Data Sources](#data-sources)
- [External Services](#external-services)
- [Authentication & Security](#authentication--security)
- [Rate Limits & Quotas](#rate-limits--quotas)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## 🌦️ **Weather Providers**

### **WillyWeather API**

Primary weather service provider with comprehensive Australian weather data.

**API Documentation**: [https://www.willyweather.com.au/api/docs/index.html](https://www.willyweather.com.au/api/docs/index.html)

**Features**:
- 7-day weather forecasts
- Australian location coverage
- Detailed weather conditions
- Temperature and precipitation data

**Integration**:
```javascript
// Backend integration (Flask)
WILLYWEATHER_API_KEY = os.getenv('WILLYWEATHER_API_KEY')

def get_willyweather_forecast(lat, lon, days=7):
    url = f"https://api.willyweather.com.au/v1/{WILLYWEATHER_API_KEY}/forecasts/weather"
    params = {
        'lat': lat,
        'lng': lon,
        'forecast': 'weather',
        'days': days
    }
    response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
    return normalize_willyweather_response(response.json())
```

**Response Normalization**:
```javascript
function normalizeWillyweatherResponse(data) {
  return {
    location: {
      lat: data.location.lat,
      lon: data.location.lng
    },
    days: data.forecasts.weather.days.length,
    forecast: data.forecasts.weather.days.map(day => ({
      day: day.date,
      summary: day.entries[0].summary,
      tempMin: day.entries[0].min,
      tempMax: day.entries[0].max
    }))
  };
}
```

---

### **Open-Meteo API**

Free weather service with global coverage and no API key required.

**API Documentation**: [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)

**Features**:
- Global weather coverage
- No authentication required
- High accuracy forecasts
- Multiple weather variables

**Integration**:
```javascript
// Backend integration
def get_open_meteo_forecast(lat, lon, days=7):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': lat,
        'longitude': lon,
        'daily': 'temperature_2m_min,temperature_2m_max,weathercode',
        'timezone': 'auto'
    }
    response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
    return normalize_open_meteo_response(response.json())
```

**Weather Code Mapping**:
```javascript
const weatherCodeMap = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow"
};
```

---

### **Mock Weather Service**

Development and testing weather service with predictable responses.

**Features**:
- Consistent test data
- No external dependencies
- Configurable responses
- Development environment support

**Configuration**:
```bash
# Environment variable
USE_MOCK=1  # Enable mock service
```

**Implementation**:
```javascript
// Mock weather data
const mockWeatherData = {
  location: { lat: -37.8136, lon: 144.9631 },
  days: 7,
  forecast: [
    { day: 1, summary: "Sunny", tempMin: 15, tempMax: 25 },
    { day: 2, summary: "Partly cloudy", tempMin: 12, tempMax: 22 },
    { day: 3, summary: "Rain", tempMin: 10, tempMax: 18 }
  ]
};
```

---

## 📊 **Data Sources**

### **Emergency Services Boundaries**

#### **SES (State Emergency Service)**
- **Source**: Victoria State Government
- **Format**: GeoJSON polygons
- **Coverage**: Victoria, Australia
- **Update Frequency**: Quarterly
- **Properties**: Response zone names, boundaries

#### **CFA (Country Fire Authority)**
- **Source**: Victoria State Government
- **Format**: GeoJSON polygons
- **Coverage**: Victoria, Australia
- **Update Frequency**: Quarterly
- **Properties**: Brigade names, fire district boundaries

#### **Ambulance Victoria**
- **Source**: Victoria State Government
- **Format**: GeoJSON points
- **Coverage**: Victoria, Australia
- **Update Frequency**: Monthly
- **Properties**: Facility names, locations, contact information

#### **Victoria Police**
- **Source**: Victoria State Government
- **Format**: GeoJSON points
- **Coverage**: Victoria, Australia
- **Update Frequency**: Monthly
- **Properties**: Station names, locations, contact information

#### **FRV (Fire Rescue Victoria)**
- **Source**: Victoria State Government
- **Format**: GeoJSON polygons
- **Coverage**: Victoria, Australia
- **Update Frequency**: Quarterly
- **Properties**: Agency names, coverage areas

#### **LGA (Local Government Areas)**
- **Source**: Australian Bureau of Statistics
- **Format**: GeoJSON polygons
- **Coverage**: Victoria, Australia
- **Update Frequency**: Annual
- **Properties**: LGA names, administrative boundaries

---

### **Data Loading Patterns**

#### **GeoJSON Processing**
```javascript
// Standard data loading response
{
  success: boolean,
  data: GeoJSON,
  layer: L.Layer,
  count: number,
  error?: string
}

// Example: Loading SES boundaries
async function loadSESBoundaries() {
  try {
    const response = await fetch('/geojson/ses.geojson');
    const geojson = await response.json();
    
    const layer = L.geoJSON(geojson, {
      style: window.sesStyle,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(feature.properties.RESPONSE_ZONE_NAME);
      }
    });
    
    return {
      success: true,
      data: geojson,
      layer: layer,
      count: geojson.features.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

## 🔌 **External Services**

### **Geocoding Services**

#### **Nominatim (OpenStreetMap)**
- **Service**: Free geocoding service
- **Coverage**: Global
- **Rate Limit**: 1 request per second
- **Usage**: Address search and coordinate conversion

**Integration Example**:
```javascript
// Geocoding function
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=au&limit=5`;
  
  try {
    const response = await fetch(url);
    const results = await response.json();
    
    if (results.length > 0) {
      return {
        success: true,
        lat: parseFloat(results[0].lat),
        lon: parseFloat(results[0].lon),
        displayName: results[0].display_name
      };
    } else {
      return {
        success: false,
        error: 'No results found'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Rate Limiting**:
```javascript
// Rate limiting implementation
class RateLimiter {
  constructor(requestsPerSecond = 1) {
    this.requestsPerSecond = requestsPerSecond;
    this.lastRequest = 0;
  }
  
  async waitForNextRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    const minInterval = 1000 / this.requestsPerSecond;
    
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
  }
}

const geocodingLimiter = new RateLimiter(1);
```

---

## 🔐 **Authentication & Security**

### **API Key Management**

#### **Backend Proxy Pattern**
All external API calls go through the backend to protect API keys.

```javascript
// Frontend (no API keys exposed)
const response = await fetch('/api/weather?lat=-37.8136&lon=144.9631');

// Backend (API keys secured)
WILLYWEATHER_API_KEY = os.getenv('WILLYWEATHER_API_KEY')
```

#### **Environment Configuration**
```bash
# Required environment variables
WILLYWEATHER_API_KEY=your_api_key_here
ALLOWED_ORIGINS=http://localhost:8000,https://yourdomain.com
USE_MOCK=0  # Set to 0 for production
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
WEATHER_PROVIDER=willyweather
```

#### **CORS Configuration**
```python
# Backend CORS setup
ALLOWED_ORIGINS = [
    'http://localhost:8000',
    'https://yourdomain.com'
]

CORS(app, resources={
    r"/api/*": {"origins": ALLOWED_ORIGINS}
})
```

---

## ⚡ **Rate Limits & Quotas**

### **Service-Specific Limits**

#### **WillyWeather API**
- **Rate Limit**: Varies by plan
- **Quota**: Monthly request limits
- **Throttling**: Automatic rate limiting
- **Monitoring**: Usage tracking in dashboard

#### **Open-Meteo API**
- **Rate Limit**: 10,000 requests per day
- **Quota**: Free tier available
- **Throttling**: Daily reset at midnight UTC
- **Monitoring**: No built-in monitoring

#### **Nominatim (OpenStreetMap)**
- **Rate Limit**: 1 request per second
- **Quota**: No daily limits
- **Throttling**: Strict per-second enforcement
- **Monitoring**: No built-in monitoring

### **Rate Limiting Implementation**

#### **Backend Rate Limiting**
```python
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, requests_per_second=1):
        self.requests_per_second = requests_per_second
        self.requests = defaultdict(list)
    
    def is_allowed(self, key):
        now = time.time()
        # Remove old requests
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if now - req_time < 1.0
        ]
        
        if len(self.requests[key]) < self.requests_per_second:
            self.requests[key].append(now)
            return True
        return False

# Usage
rate_limiter = RateLimiter(requests_per_second=1)
if rate_limiter.is_allowed('nominatim'):
    # Make request
    pass
else:
    # Wait or reject
    pass
```

---

## ⚠️ **Error Handling**

### **External Service Failures**

#### **Graceful Degradation**
```javascript
// Weather service fallback
async function getWeatherWithFallback(lat, lon, days) {
  // Try primary service first
  try {
    const weather = await getWillyWeatherForecast(lat, lon, days);
    if (weather.success) {
      return weather;
    }
  } catch (error) {
    console.warn('Primary weather service failed:', error);
  }
  
  // Fallback to secondary service
  try {
    const weather = await getOpenMeteoForecast(lat, lon, days);
    if (weather.success) {
      return weather;
    }
  } catch (error) {
    console.warn('Secondary weather service failed:', error);
  }
  
  // Final fallback to mock data
  return getMockWeatherData(lat, lon, days);
}
```

#### **Error Classification**
```javascript
const ErrorTypes = {
  NETWORK_ERROR: 'network_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_PARAMETERS: 'invalid_parameters',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  AUTHENTICATION_FAILED: 'authentication_failed'
};

function classifyError(error) {
  if (error.code === 'ECONNRESET') {
    return ErrorTypes.NETWORK_ERROR;
  } else if (error.status === 429) {
    return ErrorTypes.RATE_LIMIT_EXCEEDED;
  } else if (error.status === 400) {
    return ErrorTypes.INVALID_PARAMETERS;
  } else if (error.status === 503) {
    return ErrorTypes.SERVICE_UNAVAILABLE;
  } else if (error.status === 401) {
    return ErrorTypes.AUTHENTICATION_FAILED;
  }
  return 'unknown_error';
}
```

---

## 🎯 **Best Practices**

### **Integration Guidelines**

#### **1. Always Use Backend Proxy**
- Never expose API keys in frontend code
- Centralize external service calls
- Implement consistent error handling

#### **2. Implement Rate Limiting**
- Respect service rate limits
- Implement client-side throttling
- Monitor usage and quotas

#### **3. Provide Fallback Options**
- Multiple service providers
- Mock data for development
- Graceful degradation

#### **4. Cache External Responses**
- Reduce external API calls
- Implement TTL-based caching
- Handle cache invalidation

#### **5. Monitor and Log**
- Track API usage and errors
- Implement health checks
- Monitor rate limit compliance

### **Development Workflow**

#### **Environment Setup**
```bash
# Development
USE_MOCK=1
WILLYWEATHER_API_KEY=dev_key_here

# Production
USE_MOCK=0
WILLYWEATHER_API_KEY=prod_key_here
```

#### **Testing External Services**
```javascript
// Test with mock data first
if (process.env.USE_MOCK === '1') {
  return getMockWeatherData(lat, lon, days);
}

// Then test with real services
return await getRealWeatherData(lat, lon, days);
```

---

## 🔗 **Related Documentation**

- **[API Overview](README.md)**: General API information
- **[API Endpoints](endpoints.md)**: Detailed endpoint reference
- **[Architecture Overview](../architecture/overview.md)**: System design
- **[Performance Baselines](../performance/baselines.md)**: Performance optimization

---

**This integration guide provides comprehensive coverage of all third-party services, data sources, and external API integrations for WeeWoo Map Friend.**

_Created: 2025-01-01_  
_Purpose: Third-party service integration guide_  
_Maintenance: Update when new services or integrations are added_
