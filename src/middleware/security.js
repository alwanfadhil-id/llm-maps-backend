const config = require('../config');
const rateLimit = require('express-rate-limit');

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: config.security.rateLimit, // Limit setiap IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.security.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// API Key validation (opsional layer tambahan)
const validateApiKey = (req, res, next) => {
  // For production, you might want to implement a real API key validation
  // This is just an example implementation
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.CLIENT_API_KEY;
  
  if (validApiKey && (!apiKey || apiKey !== validApiKey)) {
    return res.status(401).json({ 
      error: 'Invalid API key' 
    });
  }
  
  next();
};

module.exports = {
  apiLimiter,
  corsOptions,
  validateApiKey
};

