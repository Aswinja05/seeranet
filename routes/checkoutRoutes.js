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
    const { addressId, paymentMethod, useCoins, quickDelivery } = req.body;
   
    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate('items');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
   
    // Calculate cart totals (for subtotal)
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
    
    // Determine delivery charge based on the selected address and delivery option
    let deliveryCharge;
    
    // Use quickDeliveryCharge if quick delivery is selected, otherwise use standard deliveryCharge
    if (quickDelivery && selectedAddress.quickDeliveryCharge) {
      deliveryCharge = selectedAddress.quickDeliveryCharge;
    } else {
      // Use the address-specific delivery charge for standard delivery
      deliveryCharge = selectedAddress.deliveryCharge || 0;
    }
   
    // Create the order
    const orderNumber = 'ORD' + Date.now().toString().substring(5);
    
    // Calculate total with the correct delivery charge
    const total = cart.subtotal + deliveryCharge - cart.discount - coinDiscount;
   
    const order = new Order({
      orderNumber,
      userId,
      items: cart.items.map(item => ({
        itemId: item._id,
        serviceName: item.serviceName,
        serviceType: item.serviceType,
        lining: item.lining,
        design: item.design,
        designPrice: item.designPrice,
        measurement: item.measurement,
        measurementPrice: item.measurementPrice,
        referenceImage: item.referenceImage,
        basePrice: item.basePrice,
        price: item.totalPrice,
        description: item.description,
        quantity: item.quantity || 1,
        image: item.image
      })),
      deliveryAddress: {
        type: selectedAddress.type,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode
      },
      paymentMethod,
      subtotal: cart.subtotal,
      deliveryCharge: deliveryCharge,
      discount: cart.discount,
      quickDelivery: quickDelivery,
      coinDiscount: coinDiscount,
      total: total,
      status: 'Placed',
      // If quick delivery is selected, reduce the estimated delivery time
      estimatedDelivery: quickDelivery ? 
        (() => {
          const date = new Date();
          date.setDate(date.getDate() + 1); // 3 days for quick delivery
          return date;
        })() : 
        (() => {
          const date = new Date();
          date.setDate(date.getDate() + 7); // 7 days for standard delivery
          return date;
        })()
    });
   
    await order.save();
   
    // Clear the cart
    cart.items = [];
    await cart.save();
    
    // Process referral reward
    await processReferralReward(req.session.userId);
    
    res.json({ 
      success: true, 
      orderId: orderNumber,
      orderDetails: {
        subtotal: cart.subtotal,
        deliveryCharge: deliveryCharge,
        discount: cart.discount,
        coinDiscount: coinDiscount,
        total: total,
        quickDelivery: quickDelivery
      }
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processReferralReward(userId) {
  try {
    // Find the user who placed the order
    const user = await User.findById(userId);
    
    if (!user) return;
    
    // Check if this user was referred by someone
    if (user.referredBy) {
      // Find the referring user
      const referrer = await User.findById(user.referredBy);
      
      if (!referrer) return;
      
      // Find the referral in the referrer's list
      const referralIndex = referrer.referrals.findIndex(
        ref => ref.user.toString() === user._id.toString()
      );
      
      if (referralIndex >= 0 && !referrer.referrals[referralIndex].rewarded) {
        // Update the referral as rewarded
        referrer.referrals[referralIndex].rewarded = true;
        
        // Award coins to referrer
        referrer.coins += 10;
        
        await referrer.save();
        
        console.log(`Referral reward processed: ${referrer.name} received 50 coins for referral of ${user.name}`);
      }
    }
  } catch (error) {
    console.error('Error processing referral reward:', error);
  }
}
module.exports = router;