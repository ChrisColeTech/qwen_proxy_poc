/**
 * CORS Middleware
 * Configure Cross-Origin Resource Sharing for API
 */

import cors from 'cors'

/**
 * CORS configuration options
 */
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 600 // Cache preflight request for 10 minutes
}

/**
 * CORS middleware instance
 */
export const corsMiddleware = cors(corsOptions)

export default corsMiddleware
