// models/User.js
const mongoose = require('mongoose');

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
    required: true
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

module.exports = mongoose.model('User', userSchema);