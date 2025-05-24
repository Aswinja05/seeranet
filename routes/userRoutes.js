// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');

// Check if phone number exists
router.post('/checkPhone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Check if user already exists with this phone number
    const existingUser = await User.findOne({ phone: phoneNumber });
    
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking phone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login with phone number
router.post('/phoneLogin', async (req, res) => {
  try {
    const { phoneNumber, firebaseToken } = req.body;
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    // Check if the phone number matches
    if (decodedToken.phone_number !== phoneNumber) {
      return res.status(400).json({ error: 'Phone number verification failed' });
    }
    
    // Find user by phone number
    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      return res.json({ success: false, userNotFound: true });
    }
    
    // Set session
    req.session.userId = user._id;
    
    res.json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone, 
        coins: user.coins 
      } 
    });
  } catch (error) {
    console.error('Error in phone login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register with phone verification
router.post('/registerWithPhone', async (req, res) => {
  try {
    const { name, email, phone, referralCode, firebaseToken } = req.body;
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    // Check if the phone number matches
    if (decodedToken.phone_number !== phone) {
      return res.status(400).json({ error: 'Phone number verification failed' });
    }
    
    // Check if user already exists with this phone number
    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
      return res.status(400).json({ error: 'Phone number already in use' });
    }
    
    // Check if user already exists with this email
    if (email) {
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    // Find referring user if referral code is provided
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      phone,
      referredBy,
      coins: 50 // Welcome bonus coins
    });
    
    await user.save();
    
    // Update referrer's referrals list
    if (referredBy) {
      await User.findByIdAndUpdate(referredBy, {
        $push: {
          referrals: {
            user: user._id,
            date: new Date(),
            rewarded: false
          }
        },
        $inc: {
          coins: 10
        }
      });
    }
    
    // Set session
    req.session.userId = user._id;
    
    // Fetch updated user data
    const updatedUser = await User.findById(user._id);
    
    res.json({ 
      success: true, 
      user: { 
        id: updatedUser._id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        phone: updatedUser.phone,
        coins: updatedUser.coins 
      } 
    });
  } catch (error) {
    console.error('Error registering user with phone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get referral information
router.get('/referrals', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    
    const user = await User.findById(userId)
      .select('referralCode referrals')
      .populate('referrals.user', 'name email'); // Populate referred users with their name and email
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const referralHistory = user.referrals.map(referral => ({
      name: referral.user.name,
      email: referral.user.email,
      date: referral.date,
      rewarded: referral.status
    }));
    
    res.json({ 
      referralCode: user.referralCode,
      referralCount: user.referrals.length,
      referralHistory
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reward status when referred user places first order
// This function should be called after successful order placement
async function updateReferralReward(userId) {
  try {
    const user = await User.findById(userId);
    
    if (user && user.referredBy && !user.referralRewarded) {
      // Check if this is user's first order
      const orderCount = await Order.countDocuments({ userId: user._id });
      
      if (orderCount === 1) {
        // Find the referring user
        const referrer = await User.findById(user.referredBy);
        
        if (referrer) {
          // Find this user in referrer's referrals list
          const referralIndex = referrer.referrals.findIndex(
            ref => ref.user.toString() === user._id.toString()
          );
          
          if (referralIndex >= 0 && !referrer.referrals[referralIndex].rewarded) {
            // Mark as rewarded
            referrer.referrals[referralIndex].rewarded = true;
            
            // Add coins to referring user
            referrer.coins += 50;
            
            await referrer.save();
            
            // Also mark in the referred user as rewarded
            user.referralRewarded = true;
            await user.save();
            
            console.log(`Referral reward processed: ${referrer.name} received 50 coins for referral of ${user.name}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing referral reward:', error);
  }
}

// Login (for backward compatibility or email login)
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Set session
    req.session.userId = user._id;
    
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, coins: user.coins } });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regular register (keeping for backward compatibility)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      coins: 50 // Welcome bonus coins
    });
    
    await user.save();
    
    // Set session
    req.session.userId = user._id;
    
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, coins: user.coins } });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

// Add address
router.post('/address', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const { type, street, city, state, pincode, isDefault } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If setting as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }
    
    // Add new address
    const newAddress = {
      type,
      street,
      city,
      state,
      pincode,
      isDefault: isDefault || false
    };
    
    user.addresses.push(newAddress);
    
    // Save user - this will trigger the geocoding and delivery charge calculation middleware
    await user.save();
    
    // Find the newly added address to get its computed delivery charge
    const addedAddress = user.addresses[user.addresses.length - 1];
    
    res.json({ 
      success: true, 
      addresses: user.addresses,
      newAddress: {
        ...addedAddress.toObject(),
        deliveryCharge: addedAddress.deliveryCharge || 0
      }
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update address
router.put('/address/:addressId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const addressId = req.params.addressId;
    const { type, street, city, state, pincode, isDefault } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the address to update
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // If setting as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }
    
    // Update address
    if (type) user.addresses[addressIndex].type = type;
    if (street) user.addresses[addressIndex].street = street;
    if (city) user.addresses[addressIndex].city = city;
    if (state) user.addresses[addressIndex].state = state;
    if (pincode) user.addresses[addressIndex].pincode = pincode;
    if (isDefault !== undefined) user.addresses[addressIndex].isDefault = isDefault;
    
    // Reset location and delivery charge to trigger recalculation
    user.addresses[addressIndex].location = undefined;
    user.addresses[addressIndex].deliveryCharge = undefined;
    
    // Save user - this will trigger the geocoding and delivery charge calculation middleware
    await user.save();
    
    res.json({ 
      success: true, 
      addresses: user.addresses,
      updatedAddress: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete address
router.delete('/address/:addressId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const addressId = req.params.addressId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Filter out the address to delete
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const { name, email } = req.body;
    
    // Check if email is already in use by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    
    await user.save();
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user coins
router.get('/coins', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    
    const user = await User.findById(userId).select('coins');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ coins: user.coins });
  } catch (error) {
    console.error('Error fetching user coins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user addresses
router.get('/addresses', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    
    const user = await User.findById(userId).select('addresses');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get default address
router.get('/defaultAddress', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    
    const user = await User.findById(userId).select('addresses');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
    
    res.json({ address: defaultAddress || null });
  } catch (error) {
    console.error('Error fetching default address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update the delivery charge API route to include quick delivery charge
router.get('/address/:addressId/deliveryCharge', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const addressId = req.params.addressId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the address
    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // Return both standard and quick delivery charges
    res.json({ 
      deliveryCharge: address.deliveryCharge || 0,
      quickDeliveryCharge: address.quickDeliveryCharge || 0,
      address: {
        _id: address._id,
        type: address.type,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      }
    });
  } catch (error) {
    console.error('Error fetching delivery charges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set default address
router.post('/setDefaultAddress/:addressId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const addressId = req.params.addressId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Unset all defaults
    user.addresses.forEach(address => {
      address.isDefault = false;
    });
    
    // Find the address to set as default
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // Set default
    user.addresses[addressIndex].isDefault = true;
    
    await user.save();
    
    res.json({ 
      success: true, 
      addresses: user.addresses,
      defaultAddress: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate referral code
router.post('/validate-referral', async (req, res) => {
  try {
    const { referralCode } = req.body;
    
    if (!referralCode) {
      return res.json({ valid: false });
    }
    
    // Check if the referral code exists
    const referrer = await User.findOne({ referralCode });
    
    res.json({ valid: !!referrer });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get referral statistics
router.get('/referral-stats', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Count total and rewarded referrals
    const totalReferrals = user.referrals.length;
    const rewardedReferrals = user.referrals.filter(ref => ref.rewarded).length;
    const pendingReferrals = totalReferrals - rewardedReferrals;
    
    // Calculate total coins earned from referrals
    const coinsEarned = rewardedReferrals * 50;
    
    res.json({
      referralCode: user.referralCode,
      stats: {
        totalReferrals,
        rewardedReferrals,
        pendingReferrals,
        coinsEarned
      }
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;