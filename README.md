# LLM Maps Backend

A Node.js backend application that integrates Large Language Models (LLMs) with Google Maps API to provide intelligent location search capabilities. Users can ask for places to visit, eat, or explore, and see the results on an interactive map.

## 🚀 Features

- **LLM-Enhanced Search**: Natural language processing to understand user queries about places
- **Google Maps Integration**: Search for places, get directions, and view details
- **Interactive Map Interface**: Web UI with embedded Google Maps
- **Security**: Rate limiting, API key security, and CORS protection
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  Backend    │───▶│   Google    │
│   (Web UI)  │    │   (Node.js) │    │  Maps API   │
└─────────────┘    └─────────────┘    └─────────────┘
                        │
                        ▼
                ┌─────────────┐
                │   Open WebUI│
                │   (LLM API) │
                └─────────────┘
```

### Core Components

- **Frontend**: HTML/CSS/JavaScript demo interface
- **Backend API**: Express.js server with REST endpoints
- **LLM Service**: Connects to Open WebUI for natural language processing
- **Google Maps Service**: Handles API calls to Google Maps
- **Security Layer**: Rate limiting, CORS, and API key validation

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **LLM Integration**: Open WebUI (https://github.com/open-webui/open-webui) 
- **Maps API**: Google Maps Platform
- **Frontend**: Pure HTML/CSS/JavaScript with Google Maps JavaScript API
- **Testing**: Jest
- **Security**: CORS, express-rate-limit

## 📋 Prerequisites

- Node.js (v14 or higher)
- Google Maps API Key with following APIs enabled:
  - Places API
  - Geocoding API
  - Maps JavaScript API
  - Directions API
- Open WebUI instance (for LLM functionality)

## 🔧 Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd llm-maps-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:
```env
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_server_api_key
GOOGLE_MAPS_CLIENT_KEY=your_client_api_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
API_RATE_LIMIT=100
ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001

# Open WebUI Configuration
OPEN_WEBUI_API_KEY=your_open_webui_api_key
OPEN_WEBUI_MODEL=llama3
LLM_TIMEOUT=30000
MAX_RESULTS=10
MAX_RETRIES=3
```

### 4. Configure Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Places API
   - Geocoding API
   - Maps JavaScript API
   - Directions API
4. Create two API keys:
   - **Server Key**: For backend API calls (add IP restrictions)
   - **Client Key**: For browser-based map rendering (add HTTP referrer restrictions)

### 5. Set up Open WebUI

Open WebUI is required for the LLM functionality. Here are the detailed setup instructions:

#### Option A: Docker (Recommended)
```bash
# Pull and run Open WebUI with specific configuration
docker pull ghcr.io/open-webui/open-webui:main
docker run -d -p 3000:8080 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \  # If using Ollama locally
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

#### Option B: From Source
```bash
git clone https://github.com/open-webui/open-webui.git
cd open-webui
pip install -r requirements.txt
python main.py
```

#### Option C: Pre-built Binary
1. Download the latest release from the [Open WebUI releases page](https://github.com/open-webui/open-webui/releases)
2. Extract and run the binary:
```bash
./open-webui serve
```

#### Model Configuration

**For Ollama (Recommended Free Option):**
1. Install and start Ollama: `https://ollama.ai`
2. Pull a suitable model:
```bash
ollama pull llama3
# Or other models: llama2, mistral, phi3, etc.
```
3. Configure Open WebUI to use the local Ollama instance (usually auto-detected)

**For OpenAI-Compatible APIs:**
- Configure your API endpoint in Open WebUI settings
- Set your API key in the Open WebUI interface

#### API Key Setup
1. Access Open WebUI web interface at `http://localhost:3000`
2. Create an account or sign in
3. Go to Settings → API → Create API Key
4. Copy the API key and add it to your `.env` file as `OPEN_WEBUI_API_KEY`

#### Model Selection
1. In Open WebUI settings, select or create a model for the application
2. Add the model name to your `.env` file as `OPEN_WEBUI_MODEL` (default: `llama3`)
3. Recommended models: `llama3`, `llama2`, `mistral`, or any model capable of JSON output

> **Note**: Open WebUI needs to run on port 3000 by default for the backend to connect properly

### 6. Run the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3001`

## 🌐 API Endpoints

### Maps Endpoints

- `GET /health` - Health check
- `GET /api/config` - Get client configuration
- `POST /api/maps/search` - Search for places
- `POST /api/maps/directions` - Get directions between locations
- `GET /api/maps/places/:placeId` - Get details of a specific place
- `GET /demo` - Interactive demo interface

### Search Endpoint Details

**POST /api/maps/search**

Request body:
```json
{
  "query": "best coffee shops in Manhattan",
  "location": "Manhattan, NY",
  "radius": 5000
}
```

Response:
```json
{
  "success": true,
  "llmAnalysis": {
    "intent": "search_places",
    "category": "cafe",
    "location": "Manhattan, NY",
    "query": "best coffee shops"
  },
  "places": [
    {
      "id": "place_id",
      "name": "Coffee Shop Name",
      "address": "123 Street Name",
      "rating": 4.5,
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "mapsUrl": "https://www.google.com/maps/...",
      "embedUrl": "https://www.google.com/maps/embed/..."
    }
  ],
  "searchMetadata": {
    "query": "best coffee shops in Manhattan",
    "resultsCount": 5
  }
}
```

## 🔐 Security Best Practices

### API Key Security
- **Separate Keys**: Uses different API keys for server-side and client-side operations
- **Restrictions**: Server key is restricted by IP, client key by HTTP referrer
- **Environment Variables**: All sensitive keys stored in environment variables

### Rate Limiting
- **IP-based Rate Limiting**: Limits requests per IP address (configurable)
- **Default**: 100 requests per 15 minutes per IP

### CORS Protection
- **Whitelisted Origins**: Only allows requests from specified domains
- **Configurable**: Origins defined in environment variables

## 🧪 Testing

Run the full test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🚀 Usage

1. Start the backend server: `npm run dev`
2. Start Open WebUI on port 3000
3. Open the demo interface: `http://localhost:3001/demo`
4. Ask natural language questions like:
   - "Where can I find good Italian restaurants in London?"
   - "Find parks to visit near Times Square"
   - "Best coffee shops in San Francisco with high ratings"

## 📊 API Usage Monitoring

### Google Maps API
- Monitor your API usage in the [Google Cloud Console](https://console.cloud.google.com/)
- Set up billing alerts to avoid exceeding quotas
- Different endpoints have different pricing models

### Rate Limits
- Adjust rate limits in `.env` file based on your application needs
- Default is 100 requests per 15 minutes per IP

## 🛡️ Security Considerations

1. **API Key Management**:
   - Regularly rotate API keys
   - Use different keys for development and production
   - Keep server keys secure and never expose them to the client

2. **Rate Limiting**:
   - Adjust limits based on expected usage
   - Consider implementing user-based rate limiting for authenticated users

3. **Input Validation**:
   - All user inputs are validated before processing
   - Query lengths and parameters are limited to prevent abuse

## 🤖 LLM Integration

The system integrates with Open WebUI to process natural language queries:

1. User submits natural language query
2. Query is sent to LLM via Open WebUI API
3. LLM analyzes intent and refines search parameters
4. Refined query is used with Google Maps API
5. Results are returned with map URLs and embed links

### LLM Prompt Engineering
The system uses a structured system prompt to ensure consistent JSON responses from the LLM, making it easier to process results.

## 🗺️ Map Features

- **Interactive Markers**: Click markers to see place details
- **Multiple Formats**: Get both embedded map URLs and Google Maps links
- **Responsive Design**: Works on desktop and mobile devices
- **Location-Based Search**: Search near specific locations or coordinates

## 🐳 Docker Deployment (Optional)

Build and run with Docker:
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t llm-maps-backend .
docker run -d -p 3001:3001 \
  -e GOOGLE_MAPS_API_KEY=your_key \
  -e GOOGLE_MAPS_CLIENT_KEY=your_client_key \
  --name llm-maps \
  llm-maps-backend
```

## 🔧 Troubleshooting

### Common Issues

1. **"API Key not valid" Error**:
   - Check that your Google Maps API key is valid and has required APIs enabled
   - Verify API key restrictions (IP/HTTP referrer)

2. **Open WebUI Connection Issues**:
   - Ensure Open WebUI is running on port 3000
   - Check that `OPEN_WEBUI_API_KEY` is correctly set
   - Verify the model specified in `OPEN_WEBUI_MODEL` is available

3. **Rate Limiting**:
   - Increase `API_RATE_LIMIT` in your `.env` file if needed
   - Check if you're being blocked by Google Maps API rate limits

4. **Map Not Loading**:
   - Verify `GOOGLE_MAPS_CLIENT_KEY` is correctly set and has Maps JavaScript API enabled
   - Check browser console for JavaScript errors

### Debugging

Enable detailed logging by setting environment variables:
```env
NODE_ENV=development
DEBUG=llm-maps-*
```

## 📈 Performance Considerations

- **Caching**: Consider implementing cache layers for frequently searched locations
- **Pagination**: For large result sets, implement pagination
- **Optimization**: Optimize images and static assets for faster loading
- **Monitoring**: Set up monitoring for API response times and error rates

## 🌐 Production Deployment

1. Configure a reverse proxy (nginx/Apache)
2. Set up SSL certificates
3. Configure environment-specific variables
4. Implement proper logging and monitoring
5. Set up automatic restart on failure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please create an issue in the GitHub repository with:
- Detailed description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment information (OS, Node.js version, etc.)