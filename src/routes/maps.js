const express = require('express');
const mapsController = require('../controllers/mapsController');
const { apiLimiter, validateApiKey } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting ke semua routes
router.use(apiLimiter);

// Routes
router.post('/search', validateApiKey, mapsController.searchPlaces);
router.post('/directions', validateApiKey, mapsController.getDirections);
router.get('/places/:placeId', validateApiKey, mapsController.getPlaceDetails);

module.exports = router;
