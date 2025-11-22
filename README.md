# LLM Maps Backend

A Node.js backend application that integrates Large Language Models (LLMs) with Google Maps API to provide intelligent location search capabilities. Users can ask for places to visit, eat, or explore in natural language, and see the results on an interactive map.

**Author**: Alwan Fadhil

## 🚀 Features

-   **LLM-Enhanced Search**: Uses a local LLM (via Open WebUI) to understand user intent and extract location data.
-   **Robust Fallback Mechanism**: If the LLM is unavailable, the system automatically falls back to a keyword-based parser, ensuring the app never breaks.
-   **Google Maps Integration**: Search for places, get directions, and view details with interactive markers.
-   **Security**:
    -   **Dual API Keys**: Separate Server Key (backend) and Client Key (frontend).
    -   **Rate Limiting**: Protects against abuse.
    -   **CORS**: Restricts access to authorized domains.
-   **Responsive Design**: Works seamlessly on desktop and mobile.

## 🏗️ Architecture

The project follows the **MVC (Model-View-Controller)** pattern:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  Backend    │───▶│   Google    │
│   (Web UI)  │    │   (Node.js) │    │  Maps API   │
└─────────────┘    └─────────────┘    └─────────────┘
                        │
                        ▼
                ┌─────────────┐
                │   Open WebUI│───▶ Local Ollama
                │   (LLM API) │
                └─────────────┘
```

## 📋 Prerequisites

-   **Node.js** (v14 or higher)
-   **Google Maps API Key** with the following APIs enabled:
    -   Places API (New) or Places API (Legacy)
    -   Maps JavaScript API
    -   Directions API
-   **Docker** (for running Open WebUI)
-   **Ollama** (installed on host machine)

## 🔧 Setup Guide

### 1. Clone the repository
```bash
git clone https://github.com/alwanfadhil-id/llm-maps-backend
cd llm-maps-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:
```env
# Google Maps
GOOGLE_MAPS_API_KEY=your_server_key
GOOGLE_MAPS_CLIENT_KEY=your_client_key

# Open WebUI
OPEN_WEBUI_API_KEY=your_generated_key
OPEN_WEBUI_MODEL=llama2:7b  # Must match the model installed in Ollama
```

### 4. Setup Local LLM (Open WebUI + Ollama)

This project uses **Open WebUI** as the interface for the local LLM.

**Step A: Install & Configure Ollama**
1.  Install Ollama from [ollama.com](https://ollama.com).
2.  Pull a model (e.g., Llama 2):
    ```bash
    ollama pull llama2:7b
    ```
3.  **Important for Linux**: By default, Ollama only listens on localhost. To allow Docker to access it, you must bind it to `0.0.0.0`.
    *   Create override directory: `sudo mkdir -p /etc/systemd/system/ollama.service.d`
    *   Create configuration file:
        ```bash
        echo "[Service]" | sudo tee /etc/systemd/system/ollama.service.d/override.conf
        echo "Environment=\"OLLAMA_HOST=0.0.0.0\"" | sudo tee -a /etc/systemd/system/ollama.service.d/override.conf
        ```
    *   Restart Ollama:
        ```bash
        sudo systemctl daemon-reload
        sudo systemctl restart ollama
        ```

**Step B: Run Open WebUI via Docker**
Run this command to start Open WebUI and connect it to your host's Ollama:

```bash
sudo docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

**Step C: Generate API Key**
1.  Open `http://localhost:3000`.
2.  Sign up / Login.
3.  Go to **Settings > Account > API Keys**.
4.  Create a key and copy it to your `.env` file (`OPEN_WEBUI_API_KEY`).

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Access the demo at: **http://localhost:3001/demo**

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/maps/search` | Search for places using natural language |
| POST | `/api/maps/directions` | Get directions between two points |
| GET | `/api/maps/places/:id` | Get detailed info about a place |
| GET | `/api/config` | Get public configuration (Client Key) |
| GET | `/health` | Server health check |

## 🔧 Troubleshooting

### "Model not found" Error
*   **Cause**: The model name in `.env` (`OPEN_WEBUI_MODEL`) doesn't match what's installed in Ollama.
*   **Fix**: Run `ollama list` to see installed models, then update `.env`.

### "Connection refused" / Open WebUI cannot see Ollama
*   **Cause**: Ollama is bound to `127.0.0.1` on the host, so the Docker container can't reach it.
*   **Fix**: Follow **Step A.3** in the Setup Guide to bind Ollama to `0.0.0.0`.

### "Method Not Allowed (405)"
*   **Cause**: Using the wrong API endpoint.
*   **Fix**: Ensure you are using the latest version of this codebase which uses `/api/chat/completions`.

## 🧪 Testing

Run the test suite using Jest:
```bash
npm test
```

## 📄 License
MIT License