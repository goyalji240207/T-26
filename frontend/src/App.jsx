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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
