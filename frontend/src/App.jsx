import { useState, useEffect } from "react";
import { runTransaction } from "firebase/firestore";
import "./App.css";
import {
  auth,
  provider,
  db,
  signInWithPopup,
  signOut,
  doc,
  getDoc,
  setDoc,
} from "./firebase";
import { Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminUsers from "./admin/AdminUsers";
import AdminCompetitions from "./admin/AdminCompetitions";
import AdminEvents from "./admin/AdminEvents";
import AdminRegistrations from "./admin/AdminRegistrations";
import AdminAnalytics from "./admin/AdminAnalytics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/competitions" element={<AdminCompetitions />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/registrations" element={<AdminRegistrations />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
    </Routes>
  );
}

export default App;
