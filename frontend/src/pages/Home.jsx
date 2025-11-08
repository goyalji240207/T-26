import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { runTransaction } from "firebase/firestore";
import {
  auth,
  provider,
  db,
  signInWithPopup,
  signOut,
  doc,
  getDoc,
  setDoc,
} from "../firebase";

const Home = () => {
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const initialFormData = {
    name: "",
    college: "",
    phone: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // First time login
          setShowPopup(true);
        }
        setUser(currentUser);
        setFormData(initialFormData);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const counterRef = doc(db, "metadata", "techidCounter");

      await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let nextId = 2600001;

        if (counterSnap.exists()) {
          nextId = counterSnap.data().lastId + 1;
        }

        transaction.set(counterRef, { lastId: nextId });
        transaction.set(userRef, {
          name: formData.name,
          college: formData.college,
          phone: formData.phone,
          email: user.email,
          uid: user.uid,
          techid: nextId,
          collegeCity: "",
          state: "",
          yearOfStudy: "",
          festivalFeeVerification: "not submitted",
          gender: "",
        });
      });

      setShowPopup(false);
      alert("Details saved successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error saving details. Check console for more info.");
    }
  };


  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="font-bold text-5xl my-4">Techkriti' 26</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Login with Google
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="font-bold text-4xl mb-4">
        Welcome {user.displayName || "User"} 🎉
      </h1>

      {showPopup ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-80"
        >
          <h2 className="text-2xl font-bold mb-4">Enter Your Details</h2>

          <input
            type="text"
            placeholder="Name"
            className="border p-2 rounded w-full mb-3"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="College"
            className="border p-2 rounded w-full mb-3"
            value={formData.college}
            onChange={(e) =>
              setFormData({ ...formData, college: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Mobile Number"
            className="border p-2 rounded w-full mb-4"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
          >
            Submit
          </button>
        </form>
      ) : (
        <>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 mt-4"
          >
            Sign Out
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mt-4"
          >
            Go to Profile
          </button>

          <button
            onClick={() => navigate("/workshops")}
            className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 mt-4"
          >
            Browse Workshops
          </button>
        </>
      )}
    </div>
  );
};

export default Home;