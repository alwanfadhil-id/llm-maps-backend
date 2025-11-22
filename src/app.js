const express = require('express');
const cors = require('cors');
const config = require('./config');
const mapsRoutes = require('./routes/maps');
const { corsOptions } = require('./middleware/security');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS
    this.app.use(cors(corsOptions));
    
    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Static files
    this.app.use(express.static('public'));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'LLM Maps Backend'
      });
    });

    // Client config endpoint
    this.app.get('/api/config', (req, res) => {
      res.json({
        googleMapsClientKey: config.googleMaps.clientKey
      });
    });

    // API routes
    this.app.use('/api/maps', mapsRoutes);

    // Demo page
    this.app.get('/demo', (req, res) => {
      res.sendFile(__dirname + '/public/demo.html');
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Global error handler:', error);
      
      res.status(error.status || 500).json({
        error: 'Internal server error',
        message: config.server.env === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  start() {
    this.server = this.app.listen(config.server.port, () => {
      console.log(`🚀 Server running on port ${config.server.port}`);
      console.log(`📊 Environment: ${config.server.env}`);
      console.log(`🔗 Health check: http://localhost:${config.server.port}/health`);
      console.log(`🗺️ Demo page: http://localhost:${config.server.port}/demo`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      this.server.close(() => {
        console.log('Process terminated');
      });
    });
  }
}

module.exports = App;
