// src/pages/GoogleLogin.jsx
import { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider, db } from "./firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

function GoogleLogin() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    year: "",
    city: "",
    mobile: "",
    email: "",
    techId: "",
  });
  const [loading, setLoading] = useState(false);

  // Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;
      setUser(loggedUser);
      setFormData((prev) => ({
        ...prev,
        name: loggedUser.displayName || "",
        email: loggedUser.email || "",
      }));
    } catch (error) {
      console.error("Google login error:", error);
      alert("Login failed");
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setFormData({
      name: "",
      college: "",
      year: "",
      city: "",
      mobile: "",
      email: "",
      techId: "",
    });
  };

  // Input change
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Generate next TechID (start from 260000)
  const generateTechId = async () => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("techId", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return 260000;
    const lastId = querySnapshot.docs[0].data().techId || 260000;
    return lastId + 1;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newTechId = await generateTechId();
      const finalData = { ...formData, techId: newTechId };

      await setDoc(doc(db, "users", formData.email), finalData);
      setFormData(finalData);
      alert(`Registration successful! Your TechID is ${newTechId}`);
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      {!user ? (
        <button
          onClick={handleGoogleLogin}
          className="flex items-center bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-lg font-semibold"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google logo"
            className="w-6 h-6 mr-3 bg-white rounded-full"
          />
          Sign in with Google
        </button>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Festival Registration</h2>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              className="p-2 rounded bg-gray-700 border border-gray-600"
              required
            />
            <input
              type="text"
              name="college"
              value={formData.college}
              onChange={handleChange}
              placeholder="College"
              className="p-2 rounded bg-gray-700 border border-gray-600"
              required
            />
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleChange}
              placeholder="Year of Study"
              className="p-2 rounded bg-gray-700 border border-gray-600"
              required
            />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="p-2 rounded bg-gray-700 border border-gray-600"
              required
            />
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile Number"
              className="p-2 rounded bg-gray-700 border border-gray-600"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="p-2 rounded bg-gray-700 border border-gray-600 text-gray-400"
            />

            {formData.techId && (
              <p className="text-green-400 font-semibold mt-2">
                ✅ Your TechID: {formData.techId}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 py-2 rounded font-semibold"
            >
              {loading ? "Submitting..." : "Submit Details"}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default GoogleLogin;

