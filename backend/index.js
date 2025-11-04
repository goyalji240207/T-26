import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { db, auth, bucket } from "./firebase.js";
import userRoutes from "./routes/user.route.js";
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

// Root endpoint
app.get("/", (req, res) => {
  res.send("✅ Firebase Express backend is running!");
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
