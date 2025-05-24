// utils/geocoding.js
const axios = require('axios');

// Function to convert address to lat/long coordinates
async function geocodeAddress(address) {
  try {
    // Format the address for the geocoding API
    const formattedAddress = encodeURIComponent(
      `${address.street}, ${address.city}, ${address.state}, ${address.pincode}, India`
    );
    
    // Use a geocoding API (replace API_KEY with your actual key)
    // Options include: Google Maps, Mapbox, OpenStreetMap Nominatim, etc.
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    console.log("url:", `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_MAPS_API_KEY}`)
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(location)
      return {
        lat: location.lat,
        lon: location.lng
      };
    }
    
    // Fallback if geocoding fails
    console.warn('Geocoding failed, using default location');
    return { lat: 12.9716, lon: 77.5946 }; // Default to Bangalore city center
  } catch (error) {
    console.error('Error in geocoding address:', error);
    // Return a default location if geocoding fails
    return { lat: 12.9716, lon: 77.5946 }; // Default to Bangalore city center
  }
}

// Function to calculate delivery charges based on coordinates
function calculateDeliveryCharges(deliveryLocation) {
  const basePrice = 30;
  const extraNearDistance = 2; // km
  const extraChargeNear = 50;
  const perKmCharge = 10;
  const extraIfP2 = 30;
  
  // Sample coordinates (lat, lon) for P1 and P2
  const p1 = { lat: 12.9716, lon: 77.5448 }; // Magadi Road
  const p2 = { lat: 13.0166, lon: 77.6715 }; // Ramamurthy Nagar
  
  // Haversine formula to calculate distance between two coordinates
  function getDistanceInKm(loc1, loc2) {
    const toRad = deg => (deg * Math.PI) / 180;
    const R = 6371; // Radius of the earth in km
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLon = toRad(loc2.lon - loc1.lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.lat)) *
        Math.cos(toRad(loc2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  const distToP1 = getDistanceInKm(deliveryLocation, p1);
  const distToP2 = getDistanceInKm(deliveryLocation, p2);
  
  // Check if within 2 km of either point
  if (distToP1 <= extraNearDistance || distToP2 <= extraNearDistance) {
    console.log(basePrice + extraChargeNear)
    return basePrice + extraChargeNear;
  }
  
  if (distToP1 < distToP2) {
    console.log(basePrice + distToP1 * perKmCharge)
    return basePrice + distToP1 * perKmCharge;
  } else {
    console.log(basePrice + distToP2 * perKmCharge + extraIfP2)
    return basePrice + distToP2 * perKmCharge + extraIfP2;
  }
}

module.exports = {
  geocodeAddress,
  calculateDeliveryCharges
};