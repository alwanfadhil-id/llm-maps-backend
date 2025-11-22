const axios = require('axios');
const LLMService = require('../src/services/llmService');

// Mock axios
jest.mock('axios');

describe('LLMService', () => {
  let llmService;

  beforeEach(() => {
    llmService = new (require('../src/services/llmService').constructor)();
    jest.clearAllMocks();
  });

  describe('isOpenWebUIAvailable', () => {
    it('should return true when Open WebUI is available', async () => {
      axios.get.mockResolvedValue({ status: 200 });

      const result = await llmService.isOpenWebUIAvailable();
      expect(result).toBe(true);
    });

    it('should return false when Open WebUI is not available', async () => {
      axios.get.mockRejectedValue({ code: 'ECONNREFUSED' });

      const result = await llmService.isOpenWebUIAvailable();
      expect(result).toBe(false);
    });
  });

  describe('processQuery', () => {
    it('should use fallback when Open WebUI is not available', async () => {
      jest.spyOn(llmService, 'isOpenWebUIAvailable').mockResolvedValue(false);

      const result = await llmService.processQuery('Where is the best coffee?');

      expect(result.intent).toBe('search_places');
      expect(result.query).toBe('Where is the best coffee?');
    });

    it('should call Open WebUI API when available', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: 'search_places',
                  query: 'best coffee shops',
                  category: 'cafe'
                })
              }
            }
          ]
        }
      };

      jest.spyOn(llmService, 'isOpenWebUIAvailable').mockResolvedValue(true);
      axios.post.mockResolvedValue(mockResponse);

      const result = await llmService.processQuery('Where is the best coffee?');

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/chat/completions',
        expect.objectContaining({
          model: 'llama2',
          messages: expect.arrayContaining([
            { role: 'user', content: 'Where is the best coffee?' }
          ]),
          temperature: 0.1,
          top_p: 0.9
        }),
        expect.objectContaining({
          timeout: 30000
        })
      );

      expect(result.intent).toBe('search_places');
      expect(result.query).toBe('best coffee shops');
    });

    it('should handle different response formats from LLM', async () => {
      const mockResponse = {
        data: {
          message: {
            content: JSON.stringify({
              intent: 'search_places',
              query: 'good restaurants',
              category: 'restaurant'
            })
          }
        }
      };

      jest.spyOn(llmService, 'isOpenWebUIAvailable').mockResolvedValue(true);
      axios.post.mockResolvedValue(mockResponse);

      const result = await llmService.processQuery('Find good restaurants');

      expect(result.intent).toBe('search_places');
      expect(result.query).toBe('good restaurants');
    });

    it('should use fallback on API error', async () => {
      jest.spyOn(llmService, 'isOpenWebUIAvailable').mockResolvedValue(true);
      axios.post.mockRejectedValue({ code: 'ECONNREFUSED' });

      const result = await llmService.processQuery('Find good restaurants');

      expect(result.intent).toBe('search_places');
    });

    it('should handle non-JSON responses from LLM', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This is not JSON'
              }
            }
          ]
        }
      };

      jest.spyOn(llmService, 'isOpenWebUIAvailable').mockResolvedValue(true);
      axios.post.mockResolvedValue(mockResponse);

      const result = await llmService.processQuery('Find good restaurants');

      expect(result.intent).toBe('search_places');
    });
  });

  describe('fallbackParse', () => {
    it('should detect restaurant queries', () => {
      const result = llmService.fallbackParse('I want to eat pizza');

      expect(result.category).toBe('restaurant');
      expect(result.intent).toBe('search_places');
    });

    it('should detect cafe queries', () => {
      const result = llmService.fallbackParse('Find me a good coffee place');

      expect(result.category).toBe('cafe');
      expect(result.intent).toBe('search_places');
    });

    it('should detect park queries', () => {
      const result = llmService.fallbackParse('Where can I go to relax in nature?');

      expect(result.category).toBe('park');
      expect(result.intent).toBe('search_places');
    });

    it('should detect location in query', () => {
      const result = llmService.fallbackParse('Find restaurants in New York');

      expect(result.location).toBe('new york');
      expect(result.intent).toBe('search_places');
    });
  });
});