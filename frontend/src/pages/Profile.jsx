import React from 'react';
import { useState, useEffect } from "react";
import { auth, db, doc, getDoc, updateDoc } from "../firebase";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setFormData(data);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(userData);
  };

  const handleSave = async () => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    let profilePicUrl = userData.profilePicUrl || '';

    if (profilePic) {
      const storage = getStorage();
      if (userData.profilePicUrl) {
        const oldPicRef = ref(storage, userData.profilePicUrl);
        try {
          await deleteObject(oldPicRef);
        } catch (error) {
          console.error("Error deleting old profile picture:", error);
        }
      }
      const newPicRef = ref(storage, `profile-pics/${user.uid}`);
      await uploadBytes(newPicRef, profilePic);
      profilePicUrl = await getDownloadURL(newPicRef);
    }

    const updatedData = { ...formData, profilePicUrl };
    await updateDoc(userRef, updatedData);
    setUserData(updatedData);
    setEditMode(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0]);
  };

  if (!user || !userData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="font-bold text-4xl mb-4">Profile Page</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-80">
        <div className="mb-4 text-center">
          <img 
            src={userData.profilePicUrl || 'https://via.placeholder.com/150'}
            alt="Profile" 
            className="w-32 h-32 rounded-full mx-auto" 
          />
          {editMode && (
            <input type="file" onChange={handleFileChange} className="mt-2" />
          )}
        </div>

        {editMode ? (
          <>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="border p-2 rounded w-full mb-3" placeholder="Name" />
            <input type="text" name="college" value={formData.college} onChange={handleChange} className="border p-2 rounded w-full mb-3" placeholder="College" />
            <select name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} className="border p-2 rounded w-full mb-3">
              <option value="">Year of Study</option>
              <option value="1st year">1st year</option>
              <option value="2nd year">2nd year</option>
              <option value="3rd year">3rd year</option>
              <option value="4th year">4th year</option>
              <option value="graduated">Graduated</option>
              <option value="6th to 9th standard">6th to 9th standard</option>
            </select>
            <input type="text" name="collegeCity" value={formData.collegeCity} onChange={handleChange} className="border p-2 rounded w-full mb-3" placeholder="College City" />
            <input type="text" name="state" value={formData.state} onChange={handleChange} className="border p-2 rounded w-full mb-3" placeholder="State" />
            <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 rounded w-full mb-3">
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="border p-2 rounded w-full mb-3" placeholder="Phone" />
            <div className="flex justify-between">
              <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Save</button>
              <button onClick={handleCancel} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4"><strong>Name:</strong> {userData.name}</p>
            <p className="mb-4"><strong>Email:</strong> {userData.email}</p>
            <p className="mb-4"><strong>College:</strong> {userData.college}</p>
            <p className="mb-4"><strong>Year of Study:</strong> {userData.yearOfStudy}</p>
            <p className="mb-4"><strong>College City:</strong> {userData.collegeCity}</p>
            <p className="mb-4"><strong>State:</strong> {userData.state}</p>
            <p className="mb-4"><strong>Gender:</strong> {userData.gender}</p>
            <p className="mb-4"><strong>Phone:</strong> {userData.phone}</p>
            <p className="mb-4"><strong>TechID:</strong> {userData.techid}</p>
            <p className="mb-4"><strong>Festival Fee Verification:</strong> {userData.festivalFeeVerification}</p>
            <button onClick={handleEdit} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mt-4">Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
