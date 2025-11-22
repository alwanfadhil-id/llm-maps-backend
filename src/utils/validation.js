/**
 * Utility functions for input validation and sanitization
 */

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const validateAndSanitize = {
  /**
   * Validates and sanitizes search query
   */
  query: (query) => {
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string', 'query');
    }

    if (query.trim().length < 2) {
      throw new ValidationError('Query must be at least 2 characters long', 'query');
    }

    if (query.length > 500) {
      throw new ValidationError('Query is too long (max 500 characters)', 'query');
    }

    // Sanitize by removing potentially dangerous characters
    return query.replace(/[<>]/g, '').trim();
  },

  /**
   * Validates and sanitizes location
   */
  location: (location) => {
    if (!location) return null;

    if (typeof location !== 'string') {
      throw new ValidationError('Location must be a string', 'location');
    }

    if (location.length > 200) {
      throw new ValidationError('Location is too long (max 200 characters)', 'location');
    }

    return location.replace(/[<>]/g, '').trim();
  },

  /**
   * Validates origin/destination for directions
   */
  originDestination: (origin, destination) => {
    if (!origin || typeof origin !== 'string' || !origin.trim()) {
      throw new ValidationError('Origin is required and must be a string', 'origin');
    }

    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      throw new ValidationError('Destination is required and must be a string', 'destination');
    }

    if (origin.length > 200 || destination.length > 200) {
      throw new ValidationError('Origin and destination must be less than 200 characters', 'origin_destination');
    }

    // Sanitize inputs
    return {
      origin: origin.replace(/[<>]/g, '').trim(),
      destination: destination.replace(/[<>]/g, '').trim()
    };
  },

  /**
   * Validates place ID
   */
  placeId: (placeId) => {
    if (!placeId || typeof placeId !== 'string' || !placeId.trim()) {
      throw new ValidationError('Place ID is required', 'placeId');
    }

    if (placeId.length > 100) {
      throw new ValidationError('Place ID is too long (max 100 characters)', 'placeId');
    }

    return placeId.trim();
  }
};

/**
 * Middleware to validate and sanitize request body
 */
const validateRequestBody = (req, res, next) => {
  try {
    if (req.body.query) {
      req.body.query = validateAndSanitize.query(req.body.query);
    }

    if (req.body.location) {
      req.body.location = validateAndSanitize.location(req.body.location);
    }

    if (req.body.origin || req.body.destination) {
      const { origin, destination } = validateAndSanitize.originDestination(
        req.body.origin,
        req.body.destination
      );
      req.body.origin = origin;
      req.body.destination = destination;
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        field: error.field
      });
    }
    next(error);
  }
};

module.exports = {
  validateAndSanitize,
  validateRequestBody,
  ValidationError
};