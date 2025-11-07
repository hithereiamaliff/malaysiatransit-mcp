/**
 * Malaysia Transit Tools
 * Tools for accessing real-time bus and train information
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import { detectAreaFromLocation, getAreaStateMapping } from './geocoding.utils.js';

// Get middleware URL from environment
const getMiddlewareUrl = (): string => {
  return process.env.MIDDLEWARE_URL || 'http://localhost:3000';
};

/**
 * Register all transit-related tools
 */
export function registerTransitTools(server: McpServer): void {
  
  // ============================================================================
  // SERVICE AREA TOOLS
  // ============================================================================
  
  server.tool(
    'list_service_areas',
    'List all available transit service areas in Malaysia (e.g., Klang Valley, Penang, Kuantan)',
    {},
    async () => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/areas`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Failed to fetch service areas',
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'detect_location_area',
    'Automatically detect which transit service area a location belongs to using geocoding. Use this when the user mentions a place name without specifying the area (e.g., "KTM Alor Setar", "Komtar", "KLCC")',
    {
      location: z.coerce.string().describe('Location name or place (e.g., "KTM Alor Setar", "Komtar", "Pavilion KL")'),
    },
    async ({ location }) => {
      try {
        const result = await detectAreaFromLocation(location);
        
        if (result) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  area: result.area,
                  confidence: result.confidence,
                  location: result.location,
                  source: result.source,
                  message: `Location "${location}" detected in service area: ${result.area}`,
                }, null, 2),
              },
            ],
          };
        } else {
          // Return available areas if detection fails
          const areaMapping = getAreaStateMapping();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: `Could not automatically detect service area for "${location}". Please specify the area manually.`,
                  availableAreas: areaMapping,
                }, null, 2),
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Failed to detect location area',
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_area_info',
    'Get detailed information about a specific transit service area',
    {
      areaId: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley", "kuantan")'),
    },
    async ({ areaId }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/areas/${areaId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch area info for ${areaId}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // STOP TOOLS
  // ============================================================================

  server.tool(
    'search_stops',
    'Search for bus or train stops by name in a specific area. IMPORTANT: If you are unsure which area a location belongs to, use detect_location_area first to automatically determine the correct area.',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley"). Use detect_location_area if unsure.'),
      query: z.coerce.string().describe('Search query (e.g., "Komtar", "KLCC")'),
    },
    async ({ area, query }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/stops/search`, {
          params: { area, q: query },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to search stops in ${area}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_stop_details',
    'Get detailed information about a specific bus or train stop',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
      stopId: z.coerce.string().describe('Stop ID from search results'),
    },
    async ({ area, stopId }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/stops/${stopId}`, {
          params: { area },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch stop details for ${stopId}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_stop_arrivals',
    'Get real-time arrival predictions for buses/trains at a specific stop',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
      stopId: z.coerce.string().describe('Stop ID from search results'),
    },
    async ({ area, stopId }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/stops/${stopId}/arrivals`, {
          params: { area },
        });
        
        // Prepare disclaimer message
        const disclaimer = `
📊 ABOUT THESE ARRIVAL PREDICTIONS:

Our middleware calculates bus arrival times using custom-made algorithms:

1. Shape-Based Distance (Preferred):
   • Uses actual route geometry from GTFS data
   • Follows the real road path with curves and turns
   • Accuracy: ±2-4 minutes compared to Google Maps/Moovit
   • Indicated by: "calculationMethod": "shape-based", "confidence": "high" or "medium"

2. Straight-Line Distance (Fallback):
   • Used when shape data unavailable or vehicle position uncertain
   • Applies 1.4x multiplier to account for road curves
   • More conservative (may show longer ETAs)
   • Indicated by: "calculationMethod": "straight-line", "confidence": "low"

Key Features:
✅ GPS Speed Validation: Rejects unrealistic speeds (>40 km/h for city buses)
✅ Time-of-Day Adjustments: Rush hour predictions are 40-45% longer
✅ Stop Dwell Time: Adds ~30 seconds per intermediate stop
✅ Ghost Bus Filtering: Removes vehicles that have passed the stop

Confidence Levels:
• High: Shape-based, vehicle within 50m of route
• Medium: Shape-based, vehicle 50-200m from route
• Low: Straight-line fallback (no shape data available)

Important Notes:
⚠️ Predictions are conservative - buses may arrive earlier than estimated
⚠️ Real-time traffic conditions (accidents, roadworks) are not factored in
⚠️ Operator-provided predictions (TripUpdates) are not yet available from Malaysia's GTFS API (planned for 2026)

Accuracy Comparison:
• Our predictions: Within 2-4 minutes of Google Maps/Moovit
• Conservative bias: Better to arrive early than miss the bus!

---

ARRIVAL DATA:
`;
        
        return {
          content: [
            {
              type: 'text',
              text: disclaimer + JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch arrivals for stop ${stopId}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'find_nearby_stops',
    'Find bus or train stops near a specific location',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
      lat: z.coerce.number().describe('Latitude coordinate'),
      lon: z.coerce.number().describe('Longitude coordinate'),
      radius: z.coerce.number().optional().default(500).describe('Search radius in meters (default: 500)'),
    },
    async ({ area, lat, lon, radius }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/stops/nearby`, {
          params: { area, lat, lon, radius },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to find nearby stops`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // ROUTE TOOLS
  // ============================================================================

  server.tool(
    'list_routes',
    'List all available bus or train routes in a specific area',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
    },
    async ({ area }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/routes`, {
          params: { area },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch routes for ${area}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_route_details',
    'Get detailed information about a specific route including stops and geometry',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
      routeId: z.coerce.string().describe('Route ID from list_routes'),
    },
    async ({ area, routeId }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/routes/${routeId}`, {
          params: { area },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch route details for ${routeId}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_route_geometry',
    'Get the geographic path and stops for a specific route (for map visualization)',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
      routeId: z.coerce.string().describe('Route ID from list_routes'),
    },
    async ({ area, routeId }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/routes/${routeId}/geometry`, {
          params: { area },
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch route geometry for ${routeId}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // REAL-TIME DATA TOOLS
  // ============================================================================

  server.tool(
    'get_live_vehicles',
    'Get real-time positions of all buses and trains in a specific area',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
      type: z.enum(['bus', 'rail']).optional().describe('Filter by transit type (optional)'),
    },
    async ({ area, type }) => {
      try {
        const params: any = { area };
        if (type) {
          params.type = type;
        }
        
        const response = await axios.get(`${getMiddlewareUrl()}/api/realtime`, {
          params,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch live vehicles for ${area}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_provider_status',
    'Check the operational status of transit providers in a specific area',
    {
      area: z.coerce.string().describe('Service area ID (e.g., "penang", "klang-valley")'),
    },
    async ({ area }) => {
      try {
        const response = await axios.get(`${getMiddlewareUrl()}/api/areas/${area}/providers/status`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Failed to fetch provider status for ${area}`,
                message: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
