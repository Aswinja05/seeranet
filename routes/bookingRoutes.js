
// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const CartItem = require('../models/CartItem');
const Cart = require('../models/Cart');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/reference-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
  }
});

// Add booking to cart
router.post('/add-to-cart', upload.single('referenceImage'), async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const {
      serviceType,
      lining,
      design,
      measurement,
      basePrice,
      description
    } = req.body;
    console.log(req.body)
    // Calculate prices based on selections
    let designPrice = 0;
    if (design === 'Princess Cut') designPrice = 149;
    else if (design === 'High Neck' || design === 'Boat Neck') designPrice = 89;
    else if (design === 'Back Design') designPrice = 199;
    
    let measurementPrice = 0;
    if (measurement === 'Home Visit for Measurement') measurementPrice = 29;
    
    // Reference image path if uploaded
    const referenceImage = req.file ? `/uploads/reference-images/${req.file.filename}` : null;
    
    // Default image based on design selection
    let image = '/imgs/WhatsApp Image 2025-04-09 at 19.41.16_9df32446.jpg'; // Classic design default
    if (design === 'Sleeveless') image = '/imgs/WhatsApp Image 2025-04-08 at 22.12.32_bf96343f.jpg';
    else if (design === 'Princess Cut') image = '/imgs/WhatsApp Image 2025-04-08 at 22.12.33_5ac72e2e.jpg';
    else if (design === 'High Neck') image = '/imgs/WhatsApp Image 2025-04-08 at 22.12.32_eefd16f4.jpg';
    else if (design === 'Boat Neck') image = '/imgs/WhatsApp Image 2025-04-08 at 22.12.34_66b5aca8.jpg';
    else if (design === 'Back Design') image = '/imgs/WhatsApp Image 2025-04-08 at 22.12.31_004fcb1e.jpg';
    else if (design === 'draping') image = '/imgs/ChatGPT_Image_Apr_7__2025__07_11_42_PM-removebg-preview.png';
    
    // Create new cart item
    const cartItem = new CartItem({
      userId,
      serviceName: 'Blouse Stitching',
      serviceType: serviceType || 'Blouse Stitching',
      lining: lining || 'Without Lining',
      design,
      designPrice,
      measurement,
      measurementPrice,
      referenceImage,
      basePrice: parseFloat(basePrice) || 249,
      description,
      image
    });
    
    await cartItem.save();
    
    // Find user's cart or create if doesn't exist
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({
        userId,
        items: [cartItem._id]
      });
    } else {
      cart.items.push(cartItem._id);
    }
    
    cart.updatedAt = new Date();
    await cart.save();
    
    // Calculate cart totals
    const updatedCart = await Cart.findById(cart._id).populate('items');
    let subtotal = 0;
    updatedCart.items.forEach(item => {
      subtotal += item.totalPrice * item.quantity;
    });
    
    const deliveryCharge = subtotal >= 500 ? 0 : 49;
    const total = subtotal + deliveryCharge - (updatedCart.discount || 0);
    
    updatedCart.subtotal = subtotal;
    updatedCart.deliveryCharge = deliveryCharge;
    updatedCart.total = total;
    
    await updatedCart.save();
    
    res.json({ success: true, cartItem, cart: updatedCart });
  } catch (error) {
    console.error('Error adding booking to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
