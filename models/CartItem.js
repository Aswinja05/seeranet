
// models/CartItem.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Blouse Stitching', 'Saree Alteration','Saree Draping']
  },
  lining: {
    type: String,
    enum: ['With Lining', 'Without Lining'],
  },
  design: {
    type: String,
    // required: true
  },
  designPrice: {
    type: Number,
    default: 0
  },
  measurement: {
    type: String,
    enum: ['Provide Measurement Blouse', 'Home Visit for Measurement']
  },
  measurementPrice: {
    type: Number,
    default: 0
  },
  referenceImage: {
    type: String
  },
  description: {
    type: String
  },
  basePrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    // required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  image: {
    type: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total price before saving
cartItemSchema.pre('save', function(next) {
  this.totalPrice = this.basePrice + this.designPrice + this.measurementPrice;
  if (this.lining === 'With Lining') {
    this.totalPrice += 49;
  }
  next();
});

module.exports = mongoose.model('CartItem', cartItemSchema);
