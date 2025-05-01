// server.js - Main server file
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const Razorpay = require("razorpay");
const Order = require("./models/Order");
const cartRoutes = require("./routes/cartRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const adminRoutes = require('./routes/adminRoutes');
const dotenv = require("dotenv");
const admin = require('firebase-admin');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
let serviceAccount;
try {

  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    }),
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  process.exit(1); // Exit if Firebase Admin cannot be initialized
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "seera-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  })
);

// Make Firebase Admin available to routes
app.use((req, res, next) => {
  req.firebaseAdmin = admin;
  next();
});

// Routes
app.use("/api/cart", cartRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use('/admin', adminRoutes);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/home/index.html");
});

app.get("/cart", (req, res) => {
  res.sendFile(__dirname + "/public/cartPage/index.html");
});

app.get("/booking/:type", (req, res) => {
  res.sendFile(__dirname + "/public/booking/index.html");
});

app.get("/loginPage", (req, res) => {
  res.sendFile(__dirname + "/public/login/index.html");
});

app.get("/regPage", (req, res) => {
  res.sendFile(__dirname + "/public/register/index.html");
});

app.get("/order-confirmation/:orderId", (req, res) => {
  res.sendFile(path.join(__dirname, "public/order-confirmation/index.html"));
});

app.get("/auth/status", (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get("/profile", (req, res) => {
  res.sendFile(__dirname + "/public/profile/index.html");
});

app.get("/orderDetails/:orderId", async (req, res) => {
  const orderdetails = await Order.findOne({ orderNumber: req.params.orderId });
  if (orderdetails) {
    res.json(orderdetails);
  } else {
    res.status(404).json({ message: "Order not found" });
  }
});

app.get("/paynow/:orderId", async (req, res) => {
  const orderdetails = await Order.findOne({ orderNumber: req.params.orderId });
  let total = orderdetails.total;
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  // Create Razorpay order
  const orderOptions = {
    amount: total * 100, // Amount in paise
    currency: "INR",
    receipt: orderdetails.userId,
    payment_capture: 1, // Auto-capture payment
  };
  const order = await razorpay.orders.create(orderOptions);
  res.json({
    orderId: order.id,
    amount: order.amount,
    // amount:2,
    currency: order.currency,
    key: RAZORPAY_KEY_ID, // Send the key for Razorpay SDK
  });
});

const crypto = require("crypto");

app.post("/payment/verify", async (req, res) => {
  const { orderId, paymentId, razorpayOrderId, signature } = req.body;
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const body = razorpayOrderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === signature) {
    // Payment verified — update DB
    await Order.updateOne(
      { orderNumber: orderId },
      {
        $set: {
          paymentStatus: "Paid",
          paymentId: paymentId,
          razorpayOrderId: razorpayOrderId,
        },
      }
    );

    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

app.get("/orders", async (req, res) => {
  if (req.session && req.session.userId) {
    let orders = await Order.find({ userId: req.session.userId });
    res.json({ orders });
  } else {
    res.redirect("/loginPage");
  }
});

app.get("/myOrders", async (req, res) => {
  res.sendFile(__dirname + "/public/myOrders/index.html");
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});