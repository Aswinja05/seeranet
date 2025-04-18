
// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');

// Process checkout
router.post('/', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const { addressId, paymentMethod } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Get user's address
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const address = user.addresses.id(addressId);
    if (!address && addressId !== 'new') {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // Create order items
    const orderItems = cart.items.map(item => ({
      serviceName: item.serviceName,
      serviceType: item.serviceType,
      lining: item.lining,
      design: item.design,
      measurement: item.measurement,
      referenceImage: item.referenceImage,
      price: item.totalPrice,
      quantity: item.quantity,
      image: item.image
    }));
    
    // Create new order
    const order = new Order({
      userId,
      items: orderItems,
      subtotal: cart.subtotal,
      deliveryCharge: cart.deliveryCharge,
      discount: cart.discount,
      total: cart.total,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      deliveryAddress: address || req.body.newAddress
    });
    
    await order.save();
    
    // Clear cart after successful order
    cart.items = [];
    cart.subtotal = 0;
    cart.deliveryCharge = 0;
    cart.discount = 0;
    cart.total = 0;
    cart.updatedAt = new Date();
    await cart.save();
    
    // Add coins to user (5% of order value)
    const coinsEarned = Math.floor(order.total * 0.05);
    user.coins += coinsEarned;
    await user.save();
    
    res.json({ 
      success: true, 
      orderId: order._id,
      orderNumber: order.orderNumber,
      coinsEarned 
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
