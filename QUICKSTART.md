# Malaysia Transit MCP - Quick Start Guide

## 🚀 Local Testing with Smithery Playground

### Step 1: Start Your Middleware

First, ensure your Malaysia Transit Middleware is running:

```bash
cd path/to/malaysiatransit-middleware
npm run dev
```

The middleware should be running on `http://localhost:3000`.

### Step 2: Configure Environment

Create a `.env` file in the MCP project root:

```bash
cd c:\Users\hello\Codeium\malaysiatransit-mcp
copy .env.sample .env
```

Edit `.env`:
```env
MIDDLEWARE_URL=http://localhost:3000
```

### Step 3: Start Smithery Dev Server

```bash
npm run dev
```

This will:
1. Build your MCP server
2. Start the Smithery CLI in development mode
3. Open the Smithery playground in your browser

### Step 4: Test in Smithery Playground

In the Smithery playground interface:

1. **Test the hello tool:**
   ```
   Call: hello
   ```
   Expected: Returns server info and middleware URL

2. **List service areas:**
   ```
   Call: list_service_areas
   ```
   Expected: Returns all available transit areas

3. **Search for stops:**
   ```
   Call: search_stops
   Parameters:
     area: "penang"
     query: "Komtar"
   ```
   Expected: Returns matching stops

4. **Get real-time arrivals:**
   ```
   Call: get_stop_arrivals
   Parameters:
     area: "penang"
     stopId: "<stop_id_from_search>"
   ```
   Expected: Returns upcoming bus arrivals

5. **Get live vehicles:**
   ```
   Call: get_live_vehicles
   Parameters:
     area: "penang"
   ```
   Expected: Returns real-time vehicle positions

## 📝 Testing Checklist

- [ ] `hello` - Server responds correctly
- [ ] `list_service_areas` - Returns all areas
- [ ] `get_area_info` - Returns area details
- [ ] `search_stops` - Finds stops by name
- [ ] `get_stop_details` - Returns stop information
- [ ] `get_stop_arrivals` - Returns real-time arrivals ⭐
- [ ] `find_nearby_stops` - Finds stops by coordinates
- [ ] `list_routes` - Returns all routes
- [ ] `get_route_details` - Returns route information
- [ ] `get_route_geometry` - Returns route path
- [ ] `get_live_vehicles` - Returns vehicle positions ⭐
- [ ] `get_provider_status` - Returns provider status

## 🐛 Troubleshooting

### "Connection refused" error

**Problem:** MCP can't connect to middleware

**Solution:**
1. Verify middleware is running: `http://localhost:3000/health`
2. Check `MIDDLEWARE_URL` in `.env`
3. Ensure no firewall is blocking port 3000

### "No data returned"

**Problem:** Tools return empty results

**Solution:**
1. Check provider status: `get_provider_status({ area: "penang" })`
2. Verify area ID is correct: `list_service_areas()`
3. Check middleware logs for errors

### Build errors

**Problem:** TypeScript compilation fails

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## 🚢 Deploy to Smithery

Once local testing is complete:

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Malaysia Transit MCP"
git remote add origin https://github.com/hithereiamaliff/malaysiatransit-mcp.git
git push -u origin main
```

### Step 2: Deploy

```bash
npm run deploy
```

This will:
1. Build the project
2. Deploy to Smithery
3. Generate a connection URL

### Step 3: Configure in Smithery

When connecting to your MCP server:
1. Set `middlewareUrl` to your deployed middleware URL
2. Example: `https://your-middleware.onrender.com`

## 📊 Example Usage Scenarios

### Scenario 1: "When is my bus coming?"

```
1. search_stops({ area: "penang", query: "Komtar" })
2. get_stop_arrivals({ area: "penang", stopId: "..." })
3. Response: "Bus T101 arrives in 5 minutes"
```

### Scenario 2: "Where is bus T101?"

```
1. get_live_vehicles({ area: "penang" })
2. Filter for route T101
3. Response: "Bus T101 is at [location]"
```

### Scenario 3: "What buses go to the airport?"

```
1. search_stops({ area: "penang", query: "airport" })
2. get_stop_details({ area: "penang", stopId: "..." })
3. Response: "Routes T101, T102, T103"
```

## 🔗 Next Steps

1. ✅ Test all tools in Smithery playground
2. ✅ Verify middleware connection
3. ✅ Test with different service areas
4. ✅ Deploy to Smithery
5. ✅ Publish to Smithery marketplace

## 📚 Documentation

- **[README.md](./README.md)** - Full documentation
- **[TOOLS.md](./TOOLS.md)** - Detailed tool reference
- **[PROMPT.md](./PROMPT.md)** - AI integration guide

## 🆘 Support

If you encounter issues:
1. Check middleware logs
2. Verify API endpoints are accessible
3. Test middleware directly: `curl http://localhost:3000/api/areas`
4. Review Smithery CLI output for errors

---

Happy testing! 🚌🚆
