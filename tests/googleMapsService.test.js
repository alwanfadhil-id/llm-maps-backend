const axios = require('axios');
const GoogleMapsService = require('../src/services/googleMapsService');
const config = require('../src/config');

// Mock axios
jest.mock('axios');

describe('GoogleMapsService', () => {
  let googleMapsService;

  beforeEach(() => {
    googleMapsService = new (require('../src/services/googleMapsService').constructor)();
    jest.clearAllMocks();
  });

  describe('searchPlaces', () => {
    it('should search for places successfully', async () => {
      const mockResponse = {
        data: {
          status: 'OK',
          results: [
            {
              place_id: 'test123',
              name: 'Test Place',
              formatted_address: '123 Test St',
              rating: 4.5,
              geometry: {
                location: {
                  lat: 40.7128,
                  lng: -74.0060
                }
              },
              types: ['restaurant'],
              opening_hours: { open_now: true }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const results = await googleMapsService.searchPlaces('restaurants', 'New York');
      
      expect(axios.get).toHaveBeenCalledWith(
        config.googleMaps.endpoints.places,
        expect.objectContaining({
          params: {
            query: 'restaurants in New York',
            key: config.googleMaps.apiKey
          },
          timeout: 10000
        })
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'test123',
        name: 'Test Place',
        address: '123 Test St',
        rating: 4.5,
        location: {
          lat: 40.7128,
          lng: -74.0060
        },
        types: ['restaurant'],
        openNow: true,
        totalRatings: undefined
      });
    });

    it('should handle REQUEST_DENIED status', async () => {
      const mockError = {
        data: {
          status: 'REQUEST_DENIED',
          error_message: 'API Key not valid'
        }
      };

      axios.get.mockResolvedValue(mockError);

      await expect(googleMapsService.searchPlaces('restaurants')).rejects.toThrow('API Key rejected: API Key not valid');
    });

    it('should handle OVER_QUERY_LIMIT status', async () => {
      const mockError = {
        data: {
          status: 'OVER_QUERY_LIMIT',
          error_message: 'Daily limit exceeded'
        }
      };

      axios.get.mockResolvedValue(mockError);

      await expect(googleMapsService.searchPlaces('restaurants')).rejects.toThrow('Google Maps API quota exceeded');
    });

    it('should handle ZERO_RESULTS status', async () => {
      const mockResponse = {
        data: {
          status: 'ZERO_RESULTS',
          results: []
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const results = await googleMapsService.searchPlaces('nonexistent place');
      expect(results).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      const mockError = {
        response: {
          data: { error: 'Network error' }
        }
      };

      axios.get.mockRejectedValue(mockError);

      await expect(googleMapsService.searchPlaces('restaurants')).rejects.toThrow('Failed to search places:');
    });

    it('should add radius parameter when provided', async () => {
      const mockResponse = {
        data: {
          status: 'OK',
          results: []
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await googleMapsService.searchPlaces('restaurants', 'New York', 1000);

      expect(axios.get).toHaveBeenCalledWith(
        config.googleMaps.endpoints.places,
        expect.objectContaining({
          params: {
            query: 'restaurants in New York',
            key: config.googleMaps.apiKey,
            radius: 1000
          }
        })
      );
    });

    it('should limit results according to configuration', async () => {
      const manyResults = Array.from({ length: 15 }, (_, i) => ({
        place_id: `test${i}`,
        name: `Place ${i}`,
        formatted_address: `${i} Test St`,
        geometry: {
          location: {
            lat: 40.7128 + i * 0.001,
            lng: -74.0060 + i * 0.001
          }
        }
      }));

      const mockResponse = {
        data: {
          status: 'OK',
          results: manyResults
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const results = await googleMapsService.searchPlaces('restaurants');
      
      // Should be limited by config.security.maxResults (default 10)
      expect(results).toHaveLength(config.security.maxResults);
    });
  });

  describe('generateMapsUrl', () => {
    it('should generate correct maps URL', () => {
      const url = googleMapsService.generateMapsUrl(40.7128, -74.0060, 'Test Place');
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=40.7128,-74.006&query_place_id=Test%20Place');
    });
  });

  describe('generateEmbedUrl', () => {
    it('should generate correct embed URL with default zoom', () => {
      const url = googleMapsService.generateEmbedUrl(40.7128, -74.0060);
      expect(url).toBe(`https://www.google.com/maps/embed/v1/view?key=${config.googleMaps.apiKey}&center=40.7128,-74.006&zoom=15`);
    });

    it('should generate correct embed URL with custom zoom', () => {
      const url = googleMapsService.generateEmbedUrl(40.7128, -74.0060, 12);
      expect(url).toBe(`https://www.google.com/maps/embed/v1/view?key=${config.googleMaps.apiKey}&center=40.7128,-74.006&zoom=12`);
    });
  });
});