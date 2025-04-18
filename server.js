// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config();

// const app = express();
// app.use(express.json());
// app.use(cors());
// app.use(express.static(path.join(__dirname, 'public')));

// app.get("/", (req, res) => {
//     res.sendFile(__dirname + '/public/home/index.html');
// })

// app.get("/bookNow/:type", (req, res) => {
//     const type = req.params.type;
//     // res.send(`Hello sending ${type} from server`)
//     res.sendFile(__dirname + '/public/booking/index.html');
// })

// app.get("/cart", (req, res) => {
//     res.sendFile(__dirname + '/public/cartPage/index.html');
// })

// app.listen(process.env.PORT || 5000, () => {
//     console.log(`Server running on port ${process.env.PORT || 5000}`);
//   });







// server.js - Main server file
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const cartRoutes = require("./routes/cartRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/seera_db", {
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

// Routes
app.use("/api/cart", cartRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/checkout", checkoutRoutes);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/home/index.html");
});

app.get("/cart", (req, res) => {
  res.sendFile(__dirname + "/public/cartPage/index.html");
});

app.get("/booking/:type", (req, res) => {
  res.sendFile(__dirname + "/public/booking/index.html");
});

app.get("/loginPage",(req,res)=>{
    res.sendFile(__dirname + "/public/login/index.html")
})

app.get("/regPage",(req,res)=>{
    res.sendFile(__dirname + "/public/register/index.html")
})

app.get("/order-confirmation/:orderId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "order-confirmation.html"));
});

app.get('/auth/status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.json({ loggedIn: false });
  }
});
app.get("/profile",(req,res)=>{
  res.sendFile(__dirname + "/public/profile/index.html")
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
