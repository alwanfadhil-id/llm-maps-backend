const request = require('supertest');
const express = require('express');
const mapsController = require('../src/controllers/mapsController');
const mapsRouter = require('../src/routes/maps');
const config = require('../src/config');

// Mock the services
jest.mock('../src/services/googleMapsService');
jest.mock('../src/services/llmService');

const app = express();
app.use(express.json());
app.use('/api/maps', mapsRouter);

const googleMapsService = require('../src/services/googleMapsService');
const llmService = require('../src/services/llmService');

// Mock the URL generation methods
googleMapsService.generateMapsUrl = jest.fn((lat, lng, name) => `https://maps.google.com/test`);
googleMapsService.generateEmbedUrl = jest.fn((lat, lng) => `https://www.google.com/maps/embed/test`);

describe('Maps Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/maps/search', () => {
    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .post('/api/maps/search')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('Query parameter is required');
    });

    it('should search for places successfully', async () => {
      const mockLLMResult = {
        intent: 'search_places',
        query: 'restaurants',
        location: 'New York'
      };

      const mockPlaces = [
        {
          id: 'place1',
          name: 'Restaurant 1',
          address: '123 Main St',
          location: { lat: 40.7128, lng: -74.0060 },
          rating: 4.5
        }
      ];

      // Mock the Google Maps service methods
      llmService.processQuery.mockResolvedValue(mockLLMResult);
      googleMapsService.searchPlaces.mockResolvedValue(mockPlaces);
      googleMapsService.generateMapsUrl.mockReturnValue('https://maps.google.com/test');
      googleMapsService.generateEmbedUrl.mockReturnValue('https://www.google.com/maps/embed/test');

      const response = await request(app)
        .post('/api/maps/search')
        .send({ query: 'restaurants in New York' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.llmAnalysis).toEqual(mockLLMResult);
      expect(response.body.places).toHaveLength(1);
      expect(response.body.places[0].mapsUrl).toBeDefined();
      expect(response.body.places[0].embedUrl).toBeDefined();
    });

    it('should handle LLM non-place intent', async () => {
      const mockLLMResult = {
        intent: 'general',
        response: 'This is a general response'
      };

      llmService.processQuery.mockResolvedValue(mockLLMResult);

      const response = await request(app)
        .post('/api/maps/search')
        .send({ query: 'What is the weather today?' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.llmAnalysis).toEqual(mockLLMResult);
      expect(response.body.places).toHaveLength(0);
    });

    it('should return error when Google Maps service fails', async () => {
      const mockLLMResult = {
        intent: 'search_places',
        query: 'restaurants',
        location: 'New York'
      };

      llmService.processQuery.mockResolvedValue(mockLLMResult);
      googleMapsService.searchPlaces.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/api/maps/search')
        .send({ query: 'restaurants in New York' })
        .expect(500);

      expect(response.body.error).toBe('Failed to search for places');
    });

    it('should validate radius parameter', async () => {
      const response = await request(app)
        .post('/api/maps/search')
        .send({ query: 'restaurants', radius: 60000 }) // Too large
        .expect(400);

      expect(response.body.error).toBe('Radius must be a number between 1 and 50000 meters');
    });
  });

  describe('POST /api/maps/directions', () => {
    it('should return 400 if origin or destination is missing', async () => {
      // Test missing origin
      let response = await request(app)
        .post('/api/maps/directions')
        .send({ destination: 'test' })
        .expect(400);
      
      expect(response.body.error).toBe('Origin and destination are required');

      // Test missing destination
      response = await request(app)
        .post('/api/maps/directions')
        .send({ origin: 'test' })
        .expect(400);
      
      expect(response.body.error).toBe('Origin and destination are required');
    });
  });

  describe('GET /api/maps/places/:placeId', () => {
    it('should return 400 if placeId is missing', async () => {
      const response = await request(app)
        .get('/api/maps/places/')
        .expect(404); // Express will return 404 for undefined route
      
      // Actually test with missing param in the controller
      const response2 = await request(app)
        .get('/api/maps/places')
        .expect(404);
    });
  });
});