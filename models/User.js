// models/User.js
const mongoose = require('mongoose');
const axios = require('axios');

// Geocoding and delivery charge calculation utilities
async function geocodeAddress(address) {
  try {
    // Format the address for the geocoding API
    const formattedAddress = encodeURIComponent(
      `${address.street}, ${address.city}, ${address.state}, ${address.pincode}, India`
    );
    
    // Use a geocoding API (replace API_KEY with your actual key)
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
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
    return Math.round(basePrice + extraChargeNear);
  }
  
  if (distToP1 < distToP2) {
    return Math.round(basePrice + distToP1 * perKmCharge);
  } else {
    return Math.round(basePrice + distToP2 * perKmCharge + extraIfP2);
  }
}

// New function to calculate quick delivery charges
function calculateQuickDeliveryCharge(deliveryLocation) {
  // Fixed coordinates for quick delivery calculation (Magadi Road)
  const p1 = { lat: 12.9716, lon: 77.5448 };
  
  // Haversine formula to calculate distance
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
  
  const distance = getDistanceInKm(deliveryLocation, p1);
  let totalAmount=2*(Math.round(distance * 10))
  // Calculate charge: 10rs per km
  return totalAmount;
}

// Updated address schema with location, delivery charge, and quick delivery charge
const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Home', 'Work', 'Other']
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  location: {
    lat: {
      type: Number
    },
    lon: {
      type: Number
    }
  },
  deliveryCharge: {
    type: Number
  },
  quickDeliveryCharge: {
    type: Number
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
  },
  addresses: [addressSchema],
  // Referral system fields
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referrals: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    rewarded: {
      type: Boolean,
      default: false
    }
  }],
  coins: {
    type: Number,
    default: 50
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique referral code before saving
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Only generate referral code if it doesn't exist
  if (!user.referralCode) {
    // Create a base code using user's name and a random number
    const namePart = user.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const proposedCode = `SEERA${namePart}${randomPart}`;
    
    try {
      // Check if code already exists
      const existingCode = await mongoose.model('User').findOne({ referralCode: proposedCode });
      
      if (existingCode) {
        // Try again with a different random number
        const newRandomPart = Math.floor(1000 + Math.random() * 9000);
        user.referralCode = `SEERA${namePart}${newRandomPart}`;
      } else {
        user.referralCode = proposedCode;
      }
      next();
    } catch (error) {
      return next(error);
    }
  } else {
    next();
  }
});

// Middleware to calculate delivery charges when adding/updating addresses
addressSchema.pre('save', async function(next) {
  // Skip if location and delivery charge are already set
  if (this.location && this.location.lat && this.deliveryCharge && this.quickDeliveryCharge) {
    return next();
  }
  
  try {
    // Get coordinates for the address
    const location = await geocodeAddress(this);
    this.location = location;
    
    // Calculate delivery charge
    this.deliveryCharge = calculateDeliveryCharges(location);
    
    // Calculate quick delivery charge
    this.quickDeliveryCharge = calculateQuickDeliveryCharge(location);
    console.log(this.deliveryCharge, this.quickDeliveryCharge);
    next();
  } catch (error) {
    console.error('Error calculating delivery charges:', error);
    // Set default delivery charges if calculation fails
    this.deliveryCharge = 50;
    this.quickDeliveryCharge = 70;
    next();
  }
});

module.exports = mongoose.model('User', userSchema);