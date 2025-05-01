// // routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');

// GET all orders with filtering options
router.get('/orders', async (req, res) => {
  try {
    const filter = req.query.filter;
    let query = {};

    if (filter === 'delivered') query.status = 'Delivered';
    else if (filter === 'unpaid') query.paymentStatus = 'Pending';
    else if (filter === 'processing') query.status = 'Processing';
    else if (filter === 'cancelled') query.status = 'Cancelled';
    else if (filter === 'active') {
      // Active orders: payment status is Paid AND status is not Delivered or Cancelled
      query = {
        paymentStatus: 'Paid',
        status: { $nin: ['Delivered', 'Cancelled'] }
      };
    }
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ orderDate: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET single order details
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Placed', 'Picked Up', 'Stitching', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Avoid duplicate status updates
    const lastStatus = order.statusUpdates.length > 0 
      ? order.statusUpdates[order.statusUpdates.length - 1].status 
      : null;
    if (lastStatus !== status) {
      order.statusUpdates.push({
        status,
        timestamp: new Date()
      });
    }
    
    order.status = status;
    await order.save();
    
    res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT update payment status
router.put('/orders/:id/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const validPaymentStatuses = ['Pending', 'Paid', 'Failed'];
    
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid payment status value' });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    order.paymentStatus = paymentStatus;
    await order.save();
    
    res.json({ 
      success: true, 
      message: `Payment status updated to ${paymentStatus}`,
      order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET users with search
router.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const users = await User.find(query)
      .select('name email phone coins')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST give coins to user
router.post('/give-coins', async (req, res) => {
  try {
    const { emailOrPhone, coins } = req.body;
    if (!emailOrPhone || !coins) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email/phone and coins amount are required' 
      });
    }
    const coinAmount = Number(coins);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Coins must be a positive number'
      });
    }
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    user.coins += coinAmount;
    await user.save();
    res.json({ 
      success: true, 
      message: `Added ${coinAmount} coins to ${user.name}`,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Error giving coins:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;




