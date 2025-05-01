// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const mongoose = require('mongoose');

// Get cart contents
router.get('/', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    
    // Find user's cart or create if doesn't exist
    let cart = await Cart.findOne({ userId }).populate('items');
    
    if (!cart) {
      return res.json({ cart: { items: [], subtotal: 0, deliveryCharge: 0, discount: 0, total: 0 } });
    }
    
    // Calculate cart totals
    await calculateCartTotals(cart);
    
    res.json({ cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to cart
router.post('/add', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const {
      serviceName,
      serviceType,
      lining,
      design,
      designPrice,
      measurement,
      measurementPrice,
      referenceImage,
      basePrice,
      description,
      image
    } = req.body;
    
    // Create new cart item
    const cartItem = new CartItem({
      userId,
      serviceName,
      serviceType,
      lining,
      design,
      designPrice,
      measurement,
      measurementPrice,
      referenceImage,
      basePrice,
      description,
      image,
      totalPrice: basePrice + (designPrice || 0) + (measurementPrice || 0) + (lining === 'With Lining' ? 49 : 0)
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
    await calculateCartTotals(cart);
    
    res.json({ success: true, cartItem, cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/item/:itemId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const { itemId } = req.params;
    
    // Validate itemId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    // Delete the cart item
    await CartItem.findOneAndDelete({ _id: itemId, userId });
    
    // Update the cart
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = cart.items.filter(item => item.toString() !== itemId);
      cart.updatedAt = new Date();
      await cart.save();
      
      // Calculate cart totals
      await calculateCartTotals(cart);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update item quantity
router.put('/item/:itemId/quantity', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.session.userId;
    const { itemId } = req.params;
    const { change } = req.body; // +1 or -1
    
    // Validate itemId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    // Find the cart item
    const cartItem = await CartItem.findOne({ _id: itemId, userId });
    
    if (!cartItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Update quantity
    cartItem.quantity = Math.max(1, cartItem.quantity + change);
    await cartItem.save();
    
    // Update cart totals
    const cart = await Cart.findOne({ userId });
    if (cart) {
      await calculateCartTotals(cart);
    }
    
    res.json({ success: true, quantity: cartItem.quantity });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to calculate cart totals
async function calculateCartTotals(cart) {
  const populatedCart = await Cart.findById(cart._id).populate('items');
  
  // Calculate subtotal
  let subtotal = 0;
  populatedCart.items.forEach(item => {
    subtotal += item.totalPrice * item.quantity;
  });
  
  // Set delivery charge based on order value
  const deliveryCharge = subtotal >= 500 ? 0 : 49;
  
  // Calculate total
  const total = subtotal + deliveryCharge - (populatedCart.discount || 0);
  
  // Update cart
  populatedCart.subtotal = subtotal;
  populatedCart.deliveryCharge = deliveryCharge;
  populatedCart.total = total;
  
  await populatedCart.save();
  
  return populatedCart;
}

module.exports = router;
