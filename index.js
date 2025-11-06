/**
 * Malaysia Transit MCP - Entry Point
 * 
 * This file serves as the entry point for Smithery deployment.
 * It exports the MCP server function that Smithery expects.
 */

// Import the compiled TypeScript module
import createStatelessServer from './dist/index.js';

// Export for Smithery compatibility
export default createStatelessServer;
