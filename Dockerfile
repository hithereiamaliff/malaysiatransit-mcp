# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port (if needed for HTTP mode)
EXPOSE 8182

# Start the MCP server
CMD ["node", "dist/index.js"]
