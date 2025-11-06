# Malaysia Transit MCP - Tools Documentation

This document provides detailed information about all available tools in the Malaysia Transit MCP server.

## Table of Contents

- [Service Area Tools](#service-area-tools)
- [Stop Information Tools](#stop-information-tools)
- [Route Information Tools](#route-information-tools)
- [Real-time Data Tools](#real-time-data-tools)
- [Testing Tools](#testing-tools)

---

## Service Area Tools

### `list_service_areas`

Lists all available transit service areas in Malaysia.

**Parameters:** None

**Returns:**
```json
{
  "areas": [
    {
      "id": "penang",
      "name": "Penang",
      "displayName": "Penang",
      "providerCount": 1,
      "hasRail": false,
      "hasBus": true,
      "comingSoon": false
    }
  ],
  "defaultArea": "penang",
  "timestamp": 1699200000000
}
```

**Example Usage:**
```typescript
const areas = await tools.list_service_areas();
```

---

### `get_area_info`

Get detailed information about a specific transit service area.

**Parameters:**
- `areaId` (string, required): Service area ID (e.g., "penang", "klang-valley")

**Returns:**
```json
{
  "id": "penang",
  "name": "Penang",
  "displayName": "Penang",
  "description": "Rapid Penang bus services covering George Town, Butterworth, and mainland Penang",
  "coordinates": { "lat": 5.4141, "lng": 100.3288 },
  "zoom": 13,
  "providers": [
    {
      "id": "prasarana-penang",
      "type": "bus",
      "name": "Rapid Penang",
      "color": "#00A651",
      "icon": "🚌"
    }
  ]
}
```

**Example Usage:**
```typescript
const areaInfo = await tools.get_area_info({ areaId: "penang" });
```

---

## Stop Information Tools

### `search_stops`

Search for bus or train stops by name in a specific area.

**Parameters:**
- `area` (string, required): Service area ID
- `query` (string, required): Search query (e.g., "Komtar", "KLCC")

**Returns:**
```json
[
  {
    "id": "stop_123",
    "name": "Komtar",
    "code": "PG01",
    "lat": 5.4141,
    "lng": 100.3288,
    "providerId": "prasarana-penang",
    "providerName": "Rapid Penang"
  }
]
```

**Example Usage:**
```typescript
const stops = await tools.search_stops({
  area: "penang",
  query: "Komtar"
});
```

---

### `get_stop_details`

Get detailed information about a specific bus or train stop.

**Parameters:**
- `area` (string, required): Service area ID
- `stopId` (string, required): Stop ID from search results

**Returns:**
```json
{
  "id": "stop_123",
  "name": "Komtar",
  "code": "PG01",
  "lat": 5.4141,
  "lng": 100.3288,
  "routes": [
    {
      "route_id": "T101",
      "route_short_name": "T101",
      "route_long_name": "Komtar - Airport",
      "headsign": "Airport",
      "displayDestination": "Airport"
    }
  ]
}
```

**Example Usage:**
```typescript
const stopDetails = await tools.get_stop_details({
  area: "penang",
  stopId: "stop_123"
});
```

---

### `get_stop_arrivals` ⭐

**KEY FEATURE:** Get real-time arrival predictions for buses/trains at a specific stop.

**Parameters:**
- `area` (string, required): Service area ID
- `stopId` (string, required): Stop ID from search results

**Returns:**
```json
{
  "stop": {
    "id": "stop_123",
    "name": "Komtar",
    "code": "PG01"
  },
  "arrivals": [
    {
      "routeShortName": "T101",
      "routeLongName": "Komtar - Airport",
      "headsign": "Airport",
      "arrivalTime": "2025-01-07T14:30:00Z",
      "minutesUntilArrival": 5,
      "vehicleId": "BUS123",
      "providerId": "prasarana-penang"
    }
  ],
  "timestamp": 1699200000000
}
```

**Example Usage:**
```typescript
const arrivals = await tools.get_stop_arrivals({
  area: "penang",
  stopId: "stop_123"
});
// AI can say: "Bus T101 arrives in 5 minutes, Bus T201 in 12 minutes"
```

---

### `find_nearby_stops`

Find bus or train stops near a specific location.

**Parameters:**
- `area` (string, required): Service area ID
- `lat` (number, required): Latitude coordinate
- `lon` (number, required): Longitude coordinate
- `radius` (number, optional): Search radius in meters (default: 500)

**Returns:**
```json
[
  {
    "id": "stop_123",
    "name": "Komtar",
    "code": "PG01",
    "lat": 5.4141,
    "lng": 100.3288,
    "distance": 250
  }
]
```

**Example Usage:**
```typescript
const nearbyStops = await tools.find_nearby_stops({
  area: "penang",
  lat: 5.4141,
  lon: 100.3288,
  radius: 500
});
```

---

## Route Information Tools

### `list_routes`

List all available bus or train routes in a specific area.

**Parameters:**
- `area` (string, required): Service area ID

**Returns:**
```json
[
  {
    "id": "T101",
    "shortName": "T101",
    "longName": "Komtar - Airport",
    "destinations": "Airport ↔ Komtar",
    "color": "#00A651",
    "providerId": "prasarana-penang",
    "providerName": "Rapid Penang",
    "providerType": "bus"
  }
]
```

**Example Usage:**
```typescript
const routes = await tools.list_routes({ area: "penang" });
```

---

### `get_route_details`

Get detailed information about a specific route.

**Parameters:**
- `area` (string, required): Service area ID
- `routeId` (string, required): Route ID from list_routes

**Returns:**
```json
{
  "routeId": "T101",
  "routeShortName": "T101",
  "routeLongName": "Komtar - Airport",
  "routeColor": "#00A651",
  "stops": [
    {
      "id": "stop_123",
      "name": "Komtar",
      "sequence": 1
    }
  ]
}
```

**Example Usage:**
```typescript
const routeDetails = await tools.get_route_details({
  area: "penang",
  routeId: "T101"
});
```

---

### `get_route_geometry`

Get the geographic path and stops for a specific route (for map visualization).

**Parameters:**
- `area` (string, required): Service area ID
- `routeId` (string, required): Route ID from list_routes

**Returns:**
```json
{
  "routeId": "T101",
  "routeShortName": "T101",
  "routeLongName": "Komtar - Airport",
  "shapes": [
    {
      "shapeId": "shape_1",
      "direction": "0",
      "headsign": "Airport",
      "coordinates": [
        [5.4141, 100.3288],
        [5.4150, 100.3290]
      ],
      "stops": [
        {
          "id": "stop_123",
          "name": "Komtar",
          "lat": 5.4141,
          "lng": 100.3288
        }
      ]
    }
  ]
}
```

**Example Usage:**
```typescript
const geometry = await tools.get_route_geometry({
  area: "penang",
  routeId: "T101"
});
```

---

## Real-time Data Tools

### `get_live_vehicles` ⭐

**KEY FEATURE:** Get real-time positions of all buses and trains in a specific area.

**Parameters:**
- `area` (string, required): Service area ID
- `type` (enum, optional): Filter by transit type ('bus' or 'rail')

**Returns:**
```json
{
  "header": {
    "timestamp": 1699200000000,
    "areaId": "penang",
    "areaName": "Penang"
  },
  "vehicles": [
    {
      "vehicleId": "BUS123",
      "position": { "lat": 5.4141, "lng": 100.3288 },
      "route": {
        "shortName": "T101",
        "longName": "Komtar - Airport"
      },
      "providerId": "prasarana-penang",
      "providerName": "Rapid Penang",
      "providerType": "bus",
      "providerIcon": "🚌",
      "providerColor": "#00A651"
    }
  ],
  "providers": [
    {
      "id": "prasarana-penang",
      "name": "Rapid Penang",
      "type": "bus",
      "status": "active",
      "vehicleCount": 50
    }
  ]
}
```

**Example Usage:**
```typescript
// Get all vehicles
const allVehicles = await tools.get_live_vehicles({ area: "penang" });

// Get only buses
const buses = await tools.get_live_vehicles({
  area: "klang-valley",
  type: "bus"
});

// Get only trains
const trains = await tools.get_live_vehicles({
  area: "klang-valley",
  type: "rail"
});
```

---

### `get_provider_status`

Check the operational status of transit providers in a specific area.

**Parameters:**
- `area` (string, required): Service area ID

**Returns:**
```json
{
  "areaId": "penang",
  "providers": [
    {
      "id": "prasarana-penang",
      "name": "Rapid Penang",
      "type": "bus",
      "status": "active",
      "lastUpdate": 1699200000000,
      "consecutiveFailures": 0
    }
  ],
  "timestamp": 1699200000000
}
```

**Example Usage:**
```typescript
const status = await tools.get_provider_status({ area: "penang" });
```

---

## Testing Tools

### `hello`

A simple test tool to verify that the MCP server is working correctly.

**Parameters:** None

**Returns:**
```json
{
  "message": "Hello from Malaysia Transit MCP!",
  "timestamp": "2025-01-07T14:00:00.000Z",
  "middlewareUrl": "http://localhost:3000"
}
```

**Example Usage:**
```typescript
const test = await tools.hello();
```

---

## Error Handling

All tools return errors in a consistent format:

```json
{
  "error": "Failed to fetch data",
  "message": "Connection refused"
}
```

Common error scenarios:
- **Connection Error**: Middleware is not accessible
- **404 Not Found**: Invalid area ID, stop ID, or route ID
- **500 Server Error**: Middleware encountered an error
- **Provider Unavailable**: Transit provider API is down

---

## Best Practices

1. **Always check service areas first** using `list_service_areas`
2. **Verify area IDs** before making requests
3. **Handle errors gracefully** - providers may have temporary outages
4. **Use `get_provider_status`** to check if data is available
5. **Cache area information** - it rarely changes
6. **Don't cache real-time data** - it updates every 30 seconds

---

## Rate Limiting

The middleware implements rate limiting:
- Minimum 2 seconds between requests per provider
- Exponential backoff for 429 errors
- Stale cache fallback when APIs are unavailable

Be mindful of request frequency to avoid hitting rate limits.
