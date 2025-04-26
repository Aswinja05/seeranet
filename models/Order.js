
// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  lining: String,
  design: String,
  measurement: String,
  referenceImage: String,
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  image: String
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash on Delivery', 'Credit / Debit Card', 'UPI / Google Pay']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  deliveryAddress: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Placed', 'Processing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  statusUpdates: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  orderDate: {
    type: Date,
    default: Date.now
  },
  estimatedDelivery: {
    type: Date
  }
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `SEERA-${timestamp}${random}`;
  }
  
  // Set estimated delivery date (7 days from order date)
  if (!this.estimatedDelivery) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    this.estimatedDelivery = deliveryDate;
  }
  
  // Add status update if new order
  if (this.isNew) {
    this.statusUpdates.push({
      status: 'Placed',
      timestamp: new Date()
    });
  }
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);