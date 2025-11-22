require('dotenv').config();

const config = {
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY, // Server-side key
    clientKey: process.env.GOOGLE_MAPS_CLIENT_KEY, // Client-side key
    endpoints: {
      places: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
      geocode: 'https://maps.googleapis.com/maps/api/geocode/json',
      directions: 'https://maps.googleapis.com/maps/api/directions/json'
    }
  },
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },
  security: {
    rateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
    allowedOrigins: process.env.ALLOWED_ORIGINS ?
      process.env.ALLOWED_ORIGINS.split(',') :
      ['http://localhost:3001', 'http://localhost:8080', 'http://127.0.0.1:3001'],
    maxResults: parseInt(process.env.MAX_RESULTS) || 10, // Max results from Google Maps
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3, // Max retries for failed requests
    llmTimeout: parseInt(process.env.LLM_TIMEOUT) || 30000 // Timeout for LLM requests
  }
};

// Validasi config
if (!config.googleMaps.apiKey) {
  console.error('WARNING: GOOGLE_MAPS_API_KEY is not set');
}

if (!config.googleMaps.clientKey) {
  console.error('WARNING: GOOGLE_MAPS_CLIENT_KEY is not set');
}

module.exports = config;
