/**
 * MCP Inspector Entry Point
 * This file creates a stdio-based MCP server for local testing with MCP Inspector
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import createStatelessServer from './index.js';

// Create the MCP server
const server = createStatelessServer({
  config: {
    middlewareUrl: process.env.MIDDLEWARE_URL || 'http://localhost:3000'
  }
});

// Create stdio transport
const transport = new StdioServerTransport();

// Connect server to transport
await server.connect(transport);

console.error('Malaysia Transit MCP Server running on stdio');
