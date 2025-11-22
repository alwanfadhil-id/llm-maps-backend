const axios = require('axios');
const config = require('../config');

class GoogleMapsService {
  constructor() {
    this.apiKey = config.googleMaps.apiKey;
    console.log('Google Maps Service initialized with API key:', this.apiKey ? 'Present' : 'MISSING');
  }

  async searchPlaces(query, location = null, radius = null) {
    try {
      let searchQuery = query;
      
      // Jika location provided, tambahkan ke query
      if (location) {
        searchQuery = `${query} in ${location}`;
      }

      const params = {
        query: searchQuery,
        key: this.apiKey
      };

      // Tambahkan radius jika disediakan
      if (radius) {
        params.radius = radius;
      }

      console.log('Searching places with params:', { query: params.query, hasLocation: !!location, hasRadius: !!radius });

      const response = await axios.get(
        config.googleMaps.endpoints.places,
        { 
          params,
          timeout: 10000
        }
      );
      
      console.log('Google API Response status:', response.data.status);
      
      if (response.data.status === 'REQUEST_DENIED') {
        throw new Error(`API Key rejected: ${response.data.error_message}`);
      }
      
      if (response.data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('Google Maps API quota exceeded');
      }
      
      if (response.data.status === 'ZERO_RESULTS') {
        console.log('No results found for query:', searchQuery);
        return [];
      }
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message}`);
      }

      // Batasi jumlah hasil sesuai konfigurasi
      const maxResults = config.security.maxResults;
      const limitedResults = response.data.results.slice(0, maxResults);
      
      return this.formatPlacesResponse(limitedResults);
    } catch (error) {
      console.error('Error searching places:', error.message);
      if (error.response) {
        console.error('Google API response error:', error.response.data);
      }
      throw new Error(`Failed to search places: ${error.message}`);
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,geometry,rating,opening_hours,photos,website',
            key: this.apiKey
          },
          timeout: 10000
        }
      );

      return response.data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw new Error('Failed to get place details');
    }
  }

  async getDirections(origin, destination) {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin: origin,
            destination: destination,
            key: this.apiKey
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting directions:', error);
      throw new Error('Failed to get directions');
    }
  }

  formatPlacesResponse(places) {
    return places.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      types: place.types,
      openNow: place.opening_hours?.open_now
    }));
  }

  generateMapsUrl(lat, lng, placeName) {
    const encodedName = encodeURIComponent(placeName);
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodedName}`;
  }

  generateEmbedUrl(lat, lng, zoom = 15) {
    return `https://www.google.com/maps/embed/v1/view?key=${this.apiKey}&center=${lat},${lng}&zoom=${zoom}`;
  }

  // Alternative: Static map sebagai fallback
  generateStaticMapUrl(lat, lng, zoom = 15, width = 400, height = 300) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${this.apiKey}`;
  }
}

module.exports = new GoogleMapsService();
