const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const { db, auth, bucket } = require('./firebase.js');
const userRoutes = require('./routes/user.route.js');
const workshopRoutes = require('./routes/workshop.route.js');
const competitionsRoutes= require('./routes/competitions.routes.js');
// central route file (you can split by feature)

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

app.locals.db = db;
app.locals.auth = auth;
app.locals.bucket = bucket;

// Routes
app.use("/api", userRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/competitions", competitionsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("✅ Firebase Express backend is running!");
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
