# Security Best Practices

This document describes the security measures implemented in the LLM Maps Backend application to ensure secure operation and protect sensitive data.

## 🔐 Authentication & Authorization

### API Key Management
- **Separate Keys**: The application uses two different Google Maps API keys:
  - `GOOGLE_MAPS_API_KEY`: Server-side key for backend API calls (not exposed to clients)
  - `GOOGLE_MAPS_CLIENT_KEY`: Client-side key for browser-based map rendering

- **Environment Variables**: All API keys are stored in environment variables and never committed to the codebase

- **Key Restrictions**: 
  - Server key should be restricted by IP address
  - Client key should be restricted by HTTP referrer domains

### API Key Validation (Optional)
- The application includes middleware for validating client API keys via `X-API-Key` header
- This adds an additional layer of authentication for API consumers

## 🚦 Rate Limiting

### IP-Based Rate Limiting
- **Implementation**: Uses `express-rate-limit` middleware
- **Default**: 100 requests per 15-minute window per IP address
- **Configurable**: Limit can be adjusted via `API_RATE_LIMIT` environment variable

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.security.rateLimit, // Default: 100
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

## 🔒 CORS (Cross-Origin Resource Sharing)

### Origin Whitelisting
- **Configuration**: Restricts API access to specific domains
- **Default**: `http://localhost:3001,http://127.0.0.1:3001`
- **Customizable**: Can be set via `ALLOWED_ORIGINS` environment variable

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin
    if (config.security.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 🌐 Input Validation

### Query Parameter Validation
- **Required Fields**: Validates that required fields are present
- **Range Validation**: Validates numeric ranges (e.g., radius between 1 and 50000 meters)
- **Type Validation**: Ensures correct data types for all parameters

### LLM Query Processing
- **Structured Output**: Uses system prompts to ensure consistent JSON responses from LLM
- **Fallback Parsing**: Includes fallback parser in case LLM returns invalid format

## 🛡️ Error Handling & Logging

### Secure Error Handling
- **Environment-Aware**: Only shows detailed error messages in development environment
- **Generic Messages**: Production errors return generic messages to prevent information disclosure
- **Detailed Logging**: Errors are logged server-side for debugging and monitoring

### API Response Security
- **Status Codes**: Uses appropriate HTTP status codes
- **Error Messages**: Sanitizes error messages to prevent exposure of internal details
- **Rate Limit Headers**: Includes rate limit headers for client awareness

## 🔍 LLM Integration Security

### API Communication
- **Local Communication**: LLM service communicates with Open WebUI via localhost
- **Bearer Token Authentication**: Uses API key for authentication with Open WebUI
- **Timeout Configuration**: Configurable request timeouts to prevent hanging connections

### Fallback Mechanism
- **Graceful Degradation**: If Open WebUI is unavailable, falls back to basic query parsing
- **Secure Fallback**: Fallback parser uses predefined patterns instead of executing arbitrary code

## 📊 Data Protection

### Request Logging
- **Access Logging**: Logs all requests with timestamps, methods, and paths
- **PII Protection**: Does not log sensitive personal information
- **Security Monitoring**: Logs include information for detecting abnormal usage patterns

### Response Sanitization
- **Output Encoding**: Properly formats responses to prevent XSS
- **URL Validation**: Validates generated map URLs before returning

## 🛠️ Configuration Security

### Environment Variables
- **Required Variables**: Application warns if critical environment variables are missing
- **Secure Storage**: Environment variables provide separation of configuration from code
- **Validation**: Configuration values are validated at startup

### Default Security Settings
- **Secure Defaults**: Reasonable default security settings are applied
- **Override Capability**: Defaults can be overridden through environment variables
- **Configuration Validation**: Invalid configuration values are caught at startup

## 🚨 Security Monitoring

### Logging Configuration
- **Audit Trail**: Maintains log of all API requests and responses
- **Error Tracking**: Detailed error logs for debugging and security analysis
- **Performance Monitoring**: Tracks API response times and resource usage

### Anomaly Detection
- **Rate Limiting**: Prevents abuse through IP-based rate limiting
- **Input Validation**: Prevents injection attacks through proper validation
- **API Key Validation**: Optional additional authentication layer

## 📋 Security Checklist

### Before Production Deployment
- [ ] Rotate API keys and ensure they are properly restricted
- [ ] Configure appropriate rate limits based on expected usage
- [ ] Verify CORS configuration and allowed origins
- [ ] Set up proper error monitoring and alerting
- [ ] Review all environment variables for sensitive information exposure
- [ ] Test all API endpoints with various inputs to ensure proper validation

### Regular Security Review
- [ ] Monitor API usage for unusual patterns
- [ ] Rotate API keys periodically
- [ ] Review and update dependencies for security patches
- [ ] Test error handling to ensure no sensitive information is exposed
- [ ] Validate that all user inputs are properly validated and sanitized

## 💡 Security Recommendations

### For API Key Management
1. **Regular Rotation**: Rotate API keys at least every 3-6 months
2. **Specific Permissions**: Grant only the minimum required permissions to API keys
3. **Monitoring**: Set up billing alerts and API usage monitoring
4. **Access Control**: Use IP restrictions and referrer checks where possible

### For Production Deployment
1. **HTTPS**: Always use HTTPS in production environments
2. **Reverse Proxy**: Use a reverse proxy (nginx/Apache) for additional security layer
3. **WAF**: Consider implementing a Web Application Firewall
4. **Monitoring**: Set up comprehensive monitoring and alerting for security events

### For LLM Integration
1. **API Key Security**: Ensure Open WebUI API keys are properly secured
2. **Input Sanitization**: Validate all outputs from LLM before processing
3. **Rate Limiting**: Apply rate limiting to LLM API calls
4. **Timeout Management**: Configure appropriate timeouts to prevent hanging requests