const googleMapsService = require('../services/googleMapsService');
const llmService = require('../services/llmService');

class MapsController {
  async searchPlaces(req, res) {
    try {
      const { query, location, radius } = req.body;

      if (!query) {
        return res.status(400).json({
          error: 'Query parameter is required'
        });
      }

      // Validate input
      if (radius && (isNaN(radius) || radius < 1 || radius > 50000)) {
        return res.status(400).json({
          error: 'Radius must be a number between 1 and 50000 meters'
        });
      }

      // Process query dengan LLM
      const llmResult = await llmService.processQuery(query);
      
      let searchResults = [];
      let mapsData = [];

      if (llmResult.intent === 'search_places') {
        // Gunakan hasil dari LLM untuk search Google Maps
        const searchQuery = llmResult.query || query;
        const searchLocation = location || llmResult.location;

        try {
          searchResults = await googleMapsService.searchPlaces(searchQuery, searchLocation, radius);
        } catch (searchError) {
          console.error('Google Maps search error:', searchError.message);
          return res.status(500).json({
            error: 'Failed to search for places',
            message: searchError.message
          });
        }
        
        // Generate maps URLs
        mapsData = searchResults.map(place => ({
          ...place,
          mapsUrl: googleMapsService.generateMapsUrl(place.location.lat, place.location.lng, place.name),
          embedUrl: googleMapsService.generateEmbedUrl(place.location.lat, place.location.lng)
        }));
      } else {
        // If LLM says it's not a place search, return empty results
        mapsData = [];
      }

      res.json({
        success: true,
        llmAnalysis: llmResult,
        places: mapsData,
        searchMetadata: {
          query: query,
          location: location,
          radius: radius,
          resultsCount: mapsData.length
        }
      });

    } catch (error) {
      console.error('Error in searchPlaces:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getDirections(req, res) {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          error: 'Origin and destination are required'
        });
      }

      const directions = await googleMapsService.getDirections(origin, destination);
      
      res.json({
        success: true,
        directions: directions
      });

    } catch (error) {
      console.error('Error getting directions:', error);
      res.status(500).json({
        error: 'Failed to get directions'
      });
    }
  }

  async getPlaceDetails(req, res) {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        return res.status(400).json({
          error: 'Place ID is required'
        });
      }

      const details = await googleMapsService.getPlaceDetails(placeId);
      
      res.json({
        success: true,
        place: details
      });

    } catch (error) {
      console.error('Error getting place details:', error);
      res.status(500).json({
        error: 'Failed to get place details'
      });
    }
  }
}

module.exports = new MapsController();
