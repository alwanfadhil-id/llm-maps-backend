const axios = require('axios');

class LLMService {
  constructor() {
    // Open WebUI di port 3000
    this.baseUrl = 'http://localhost:3000';
    this.timeout = 30000; // 30 seconds
  }

  async processQuery(userQuery) {
    try {
      console.log('Sending query to LLM:', userQuery);

      // Jika Open WebUI tidak tersedia, langsung return fallback
      if (!await this.isOpenWebUIAvailable()) {
        console.log('Open WebUI not available, using fallback parser');
        return this.fallbackParse(userQuery);
      }

      const systemPrompt = `You are a helpful travel and food assistant. When users ask about places to go, eat, or visit, respond ONLY with JSON in this exact format:

{
  "intent": "search_places",
  "category": "restaurant|cafe|park|museum|hotel|shopping|attraction",
  "location": "specific location mentioned",
  "query": "refined search query for Google Maps",
  "suggestions": ["place name 1", "place name 2", "place name 3"]
}

If the query is not about places, respond with:
{
  "intent": "general",
  "response": "your helpful response here"
}

Be concise and only respond with the JSON format.`;

      const response = await axios.post(`${this.baseUrl}/api/chat/completions`, {
        model: process.env.OPEN_WEBUI_MODEL || "llama2",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userQuery
          }
        ],
        stream: false,
        temperature: 0.1,
        top_p: 0.9
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPEN_WEBUI_API_KEY || ''}`
        }
      });

      console.log('LLM API Response received');
      return this.parseLLMResponse(response.data);

    } catch (error) {
      console.error('Error calling LLM API:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('Cannot connect to Open WebUI. Make sure it is running on port 3000');
      } else if (error.response) {
        console.error('LLM API Error Response:', error.response.status, error.response.data);
      }
      return this.fallbackParse(userQuery);
    }
  }

  async isOpenWebUIAvailable() {
    try {
      await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  parseLLMResponse(llmResponse) {
    try {
      console.log('Raw LLM response structure:', Object.keys(llmResponse));

      let content = '';

      // Handle different response structures
      if (llmResponse.choices && llmResponse.choices[0] && llmResponse.choices[0].message) {
        content = llmResponse.choices[0].message.content;
      } else if (llmResponse.message && llmResponse.message.content) {
        content = llmResponse.message.content;
      } else if (llmResponse.content) {
        content = llmResponse.content;
      } else {
        content = JSON.stringify(llmResponse);
      }

      console.log('LLM content:', content);

      // Try to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed LLM JSON:', parsed);
        return parsed;
      } else {
        console.log('No JSON found in response, using fallback');
        return this.fallbackParse(content);
      }
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return this.fallbackParse(llmResponse);
    }
  }

  fallbackParse(userQuery) {
    console.log('Using fallback parser for query:', userQuery);

    const lowerQuery = userQuery.toLowerCase();

    const categories = {
      'restaurant': ['restaurant', 'eat', 'food', 'dinner', 'lunch', 'breakfast', 'makan', 'restoran', 'warung', 'kuliner'],
      'cafe': ['cafe', 'coffee', 'tea', 'kopi', 'kafe', 'kedai', 'warkop'],
      'park': ['park', 'outdoor', 'nature', 'taman', 'alam', 'rekreasi'],
      'museum': ['museum', 'gallery', 'art', 'galeri', 'seni', 'sejarah'],
      'hotel': ['hotel', 'stay', 'accommodation', 'penginapan', 'hotel'],
      'shopping': ['shop', 'mall', 'buy', 'shopping', 'belanja', 'pusat perbelanjaan', 'toko']
    };

    let detectedCategory = 'point_of_interest';
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        detectedCategory = category;
        break;
      }
    }

    const locations = ['jakarta', 'bali', 'bandung', 'surabaya', 'yogyakarta', 'medan', 'semarang', 'manhattan', 'new york', 'london', 'paris', 'tokyo'];
    let detectedLocation = null;

    for (const location of locations) {
      if (lowerQuery.includes(location)) {
        detectedLocation = location;
        break;
      }
    }

    return {
      intent: "search_places",
      category: detectedCategory,
      location: detectedLocation,
      query: userQuery,
      suggestions: []
    };
  }
}

module.exports = new LLMService();
