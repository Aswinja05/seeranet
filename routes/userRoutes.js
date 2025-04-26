
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Register new user
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

// Login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    console.log(req.body)

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
    user.addresses.push({
      type,
      street,
      city,
      state,
      pincode,
      isDefault: isDefault || false
    });
    
    await user.save();
    
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Error adding address:', error);
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


module.exports = router;