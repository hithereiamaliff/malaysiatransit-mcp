# Malaysia Transit MCP - AI Integration Guide

This document provides guidance for AI models on how to effectively use the Malaysia Transit MCP server.

## Overview

The Malaysia Transit MCP provides real-time bus and train information across 10+ cities in Malaysia. It connects to the Malaysia Transit Middleware API which aggregates GTFS data from multiple providers.

## Key Use Cases

### 1. "When is my bus coming?" ⭐

This is the PRIMARY use case. Users want to know when their next bus/train will arrive.

**Workflow:**
```
1. User asks: "When is the next bus at Komtar?"
2. AI uses: search_stops({ area: "penang", query: "Komtar" })
3. AI uses: get_stop_arrivals({ area: "penang", stopId: "..." })
4. AI responds: "Bus T101 arrives in 5 minutes, Bus T201 in 12 minutes"
```

### 2. "Where is my bus right now?"

Users want to track their bus in real-time.

**Workflow:**
```
1. User asks: "Where is bus T101 right now?"
2. AI uses: get_live_vehicles({ area: "penang" })
3. AI filters for route T101
4. AI responds: "Bus T101 is currently at [location], heading towards Airport"
```

### 3. "What buses go to [destination]?"

Users want to find routes to a destination.

**Workflow:**
```
1. User asks: "What buses go to the airport?"
2. AI uses: search_stops({ area: "penang", query: "airport" })
3. AI uses: get_stop_details({ area: "penang", stopId: "..." })
4. AI responds: "Routes T101, T102, and T103 serve the airport"
```

## Tool Usage Patterns

### Always Start with Service Areas

Before making any requests, discover available areas:

```typescript
const areas = await tools.list_service_areas();
// Returns: penang, klang-valley, kuantan, etc.
```

### Location Detection

When a user mentions a location, infer the service area:

- "Penang", "George Town", "Komtar" → `area: "penang"`
- "KL", "Kuala Lumpur", "KLCC", "Petaling Jaya" → `area: "klang-valley"`
- "Kuantan" → `area: "kuantan"`
- "Johor Bahru", "JB" → `area: "johor"`

### Search Before Details

Always search for stops/routes before requesting details:

```typescript
// ✅ CORRECT
const stops = await tools.search_stops({ area: "penang", query: "Komtar" });
const arrivals = await tools.get_stop_arrivals({ 
  area: "penang", 
  stopId: stops[0].id 
});

// ❌ WRONG - Don't guess stop IDs
const arrivals = await tools.get_stop_arrivals({ 
  area: "penang", 
  stopId: "random_id" 
});
```

### Handle Multiple Results

When search returns multiple results, help the user choose:

```typescript
const stops = await tools.search_stops({ area: "penang", query: "bus" });

if (stops.length > 1) {
  // Present options to user
  "I found multiple stops:
   1. Bus Terminal (PG01)
   2. Bus Station North (PG02)
   Which one do you mean?"
}
```

## Response Formatting

### Arrival Times

Format arrival times in a user-friendly way:

```typescript
// ✅ GOOD
"Bus T101 arrives in 5 minutes"
"Train LRT-KJ arrives in 2 minutes"
"Next bus: T201 in 12 minutes"

// ❌ BAD
"Arrival time: 2025-01-07T14:30:00Z"
"ETA: 1736258400000"
```

### Multiple Arrivals

Present multiple arrivals clearly:

```typescript
"Upcoming arrivals at Komtar:
• T101 → Airport: 5 minutes
• T201 → Bayan Lepas: 12 minutes
• T102 → Gurney: 18 minutes"
```

### No Data Available

Handle missing data gracefully:

```typescript
if (arrivals.length === 0) {
  "No upcoming arrivals found at this stop. 
   This could mean:
   • No buses are currently scheduled
   • The provider's real-time data is unavailable
   • The stop may not be in service"
}
```

## Error Handling

### Provider Unavailable

```typescript
try {
  const arrivals = await tools.get_stop_arrivals({ ... });
} catch (error) {
  // Check provider status
  const status = await tools.get_provider_status({ area: "penang" });
  
  if (status.providers[0].status !== "active") {
    "The transit provider is currently unavailable. 
     Please try again later or check the official transit app."
  }
}
```

### Invalid Area

```typescript
const areas = await tools.list_service_areas();
const validAreaIds = areas.areas.map(a => a.id);

if (!validAreaIds.includes(userArea)) {
  "Transit data is not available for this area yet. 
   Currently supported areas: Penang, Klang Valley, Kuantan, ..."
}
```

## Advanced Patterns

### Nearby Stops

When user provides a location:

```typescript
// If you have coordinates
const stops = await tools.find_nearby_stops({
  area: "penang",
  lat: 5.4141,
  lon: 100.3288,
  radius: 500
});

// If you only have a name
const stops = await tools.search_stops({
  area: "penang",
  query: "near KLCC"
});
```

### Route Planning

Help users plan their journey:

```typescript
// 1. Find origin stop
const originStops = await tools.search_stops({ 
  area: "penang", 
  query: "Komtar" 
});

// 2. Find destination stop
const destStops = await tools.search_stops({ 
  area: "penang", 
  query: "Airport" 
});

// 3. Get routes serving both stops
const originDetails = await tools.get_stop_details({ 
  area: "penang", 
  stopId: originStops[0].id 
});

const destDetails = await tools.get_stop_details({ 
  area: "penang", 
  stopId: destStops[0].id 
});

// 4. Find common routes
const commonRoutes = originDetails.routes.filter(r1 =>
  destDetails.routes.some(r2 => r2.route_id === r1.route_id)
);
```

### Real-time Tracking

Track a specific vehicle:

```typescript
const vehicles = await tools.get_live_vehicles({ area: "penang" });

const bus = vehicles.vehicles.find(v => 
  v.route.shortName === "T101" && 
  v.vehicleId === "BUS123"
);

if (bus) {
  "Bus T101 (vehicle BUS123) is currently at 
   coordinates ${bus.position.lat}, ${bus.position.lng}"
}
```

## Best Practices

### 1. Always Specify Area

Every tool (except `list_service_areas`) requires an `area` parameter:

```typescript
// ✅ CORRECT
await tools.search_stops({ area: "penang", query: "Komtar" });

// ❌ WRONG
await tools.search_stops({ query: "Komtar" });
```

### 2. Cache Area Information

Service area information rarely changes:

```typescript
// Cache this for the conversation
const areas = await tools.list_service_areas();

// Reuse cached data
const penangArea = areas.areas.find(a => a.id === "penang");
```

### 3. Don't Cache Real-time Data

Real-time data updates every 30 seconds:

```typescript
// ❌ DON'T DO THIS
const arrivals = await tools.get_stop_arrivals({ ... });
// ... 5 minutes later ...
// Still using old arrivals data

// ✅ DO THIS
// Fetch fresh data when user asks again
const arrivals = await tools.get_stop_arrivals({ ... });
```

### 4. Provide Context

Help users understand the data:

```typescript
"Based on real-time GPS tracking, bus T101 will arrive in 5 minutes.
 Note: Arrival times may change due to traffic conditions."
```

### 5. Suggest Alternatives

If data is unavailable:

```typescript
"Real-time data is currently unavailable for this area.
 You can:
 • Check the official Rapid Penang app
 • Visit the transit provider's website
 • Try again in a few minutes"
```

## Common Pitfalls

### ❌ Assuming Stop IDs

```typescript
// DON'T assume stop IDs
const arrivals = await tools.get_stop_arrivals({ 
  area: "penang", 
  stopId: "komtar" // This won't work!
});
```

### ❌ Mixing Areas

```typescript
// DON'T mix data from different areas
const stops = await tools.search_stops({ area: "penang", query: "KLCC" });
// KLCC is in Klang Valley, not Penang!
```

### ❌ Ignoring Provider Status

```typescript
// DON'T ignore provider failures
const arrivals = await tools.get_stop_arrivals({ ... });
// Check if provider is active first!
```

## Testing Workflow

Before deploying, test with these scenarios:

1. **Basic arrival query**: "When is the next bus at Komtar?"
2. **Route discovery**: "What buses go to the airport?"
3. **Real-time tracking**: "Where is bus T101 right now?"
4. **Multiple results**: "Find bus stops near me"
5. **Error handling**: Test with invalid area/stop IDs
6. **Provider down**: Test when provider is unavailable

## Supported Areas Reference

Quick reference for area IDs:

| User Says | Area ID |
|-----------|---------|
| Penang, George Town, Komtar | `penang` |
| KL, Kuala Lumpur, KLCC, PJ | `klang-valley` |
| Kuantan | `kuantan` |
| Kangar, Perlis | `kangar` |
| Alor Setar, Kedah | `alor-setar` |
| Kota Bharu, Kelantan | `kota-bharu` |
| Kuala Terengganu | `kuala-terengganu` |
| Melaka, Malacca | `melaka` |
| Johor Bahru, JB | `johor` |
| Kuching, Sarawak | `kuching` |

## Summary

**Key Principles:**
1. Always start with `list_service_areas`
2. Search before requesting details
3. Handle errors gracefully
4. Format responses in a user-friendly way
5. Don't cache real-time data
6. Provide context and alternatives

**Primary Use Case:**
"When is my bus coming?" → `search_stops` → `get_stop_arrivals`

**Secondary Use Cases:**
- Track vehicles: `get_live_vehicles`
- Discover routes: `list_routes` → `get_route_details`
- Find nearby stops: `find_nearby_stops`
