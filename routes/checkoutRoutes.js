const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');

// Define the calculateCartTotals function
const calculateCartTotals = async (cart) => {
  // Calculate subtotal from items
  cart.subtotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  
  // Apply delivery charge based on subtotal
  cart.deliveryCharge = cart.subtotal > 500 ? 0 : 50;
  
  // You can add logic for discount calculation here
  cart.discount = 0; // Default no discount
  
  // Calculate final total
  cart.total = cart.subtotal + cart.deliveryCharge - cart.discount;
  
  return cart;
};

// routes/checkoutRoutes.js - Checkout route
router.post('/', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.session.userId;
    const { addressId, paymentMethod, useCoins } = req.body;
   
    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate('items');
   
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
   
    // Calculate cart totals
    await calculateCartTotals(cart);
   
    // Find the user to get address details and coin balance
    const user = await User.findById(userId);
   
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
   
    // Find the selected address
    const selectedAddress = user.addresses.id(addressId);
   
    if (!selectedAddress) {
      return res.status(400).json({ error: 'Selected address not found' });
    }
   
    // Handle coins usage
    let coinDiscount = 0;
    if (useCoins && user.coins > 0) {
      // Each coin is worth ₹1
      coinDiscount = Math.min(user.coins, cart.subtotal);
      user.coins -= coinDiscount;
      await user.save();
    }
   
    // Create the order
    const orderNumber = 'ORD' + Date.now().toString().substring(5);
   
    const order = new Order({
      orderNumber,
      userId,
      items: cart.items.map(item => ({
        itemId: item._id,
        serviceName: item.serviceName,
        serviceType: item.serviceType,
        quantity: item.quantity,
        price: item.totalPrice
      })),
      // Change this from 'address' to 'deliveryAddress' to match the Order schema
      deliveryAddress: {
        type: selectedAddress.type,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode
      },
      paymentMethod,
      subtotal: cart.subtotal,
      deliveryCharge: cart.deliveryCharge,
      discount: cart.discount,
      coinDiscount: coinDiscount, // Make sure this field exists in your Order schema
      total: cart.total - coinDiscount,
      status: 'Placed'
    });
   
    await order.save();
   
    // Clear the cart
    cart.items = [];
    await cart.save();
   
    res.json({ success: true, orderId: orderNumber });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;