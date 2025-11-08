import React from 'react';
import { useState, useEffect } from "react";
import { auth, db, doc, getDoc, updateDoc } from "../firebase";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [registeredWorkshops, setRegisteredWorkshops] = useState([]);
  const [workshopDetails, setWorkshopDetails] = useState({});
  const navigate = useNavigate();

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
          
          // Fetch registered workshops
          await fetchRegisteredWorkshops(currentUser.uid);
        }
      } else {
        setUser(null);
        setUserData(null);
        setRegisteredWorkshops([]);
        setWorkshopDetails({});
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

  const fetchRegisteredWorkshops = async (userId) => {
    try {
      const registeredWorkshopsRef = collection(db, "registered_workshops", userId, "workshops");
      const registeredWorkshopsSnap = await getDocs(registeredWorkshopsRef);
      const registeredWorkshopsData = registeredWorkshopsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredWorkshops(registeredWorkshopsData);

      // Fetch workshop details for each registration
      const details = {};
      for (const registration of registeredWorkshopsData) {
        const workshopRef = doc(db, "workshops", registration.workshopId);
        const workshopSnap = await getDoc(workshopRef);
        if (workshopSnap.exists()) {
          details[registration.workshopId] = workshopSnap.data();
        }
      }
      setWorkshopDetails(details);
    } catch (error) {
      console.error("Error fetching registered workshops:", error);
    }
  };

  const handlePayment = (workshop) => {
    if (!workshop.paymentLink) {
      alert("Payment link not available for this workshop");
      return;
    }
    window.open(workshop.paymentLink, "_blank");
    // After payment, show receipt upload
    setTimeout(() => {
      const receiptFile = prompt("Please upload your payment receipt. Enter the file path or select the file:");
      if (receiptFile) {
        handleReceiptUpload(workshop);
      }
    }, 1000);
  };

  const handleReceiptUpload = async (registration) => {
    if (!user) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const storage = getStorage();
        const storageRef = ref(storage, `workshop_registration/${user.uid}/${registration.workshopId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const receiptUrl = await getDownloadURL(storageRef);

        // Update registration with receipt URL and payment status
        const userRegistrationRef = doc(db, "registered_workshops", user.uid, "workshops", registration.workshopId);
        await updateDoc(userRegistrationRef, {
          receiptUrl: receiptUrl,
          paymentStatus: "completed",
          paymentDate: serverTimestamp()
        });

        alert("Receipt uploaded successfully! Payment completed.");
        fetchRegisteredWorkshops(user.uid);
      } catch (error) {
        console.error("Error uploading receipt:", error);
        alert("Error uploading receipt. Please try again.");
      }
    };
    input.click();
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
            
            {/* Registered Workshops Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Registered Workshops ({registeredWorkshops.length}/3)</h3>
              {registeredWorkshops.length === 0 ? (
                <p className="text-gray-600 text-sm">No workshops registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {registeredWorkshops.map((registration) => {
                    const workshop = workshopDetails[registration.workshopId];
                    return (
                      <div key={registration.workshopId} className="border rounded p-3 bg-gray-50">
                        <h4 className="font-medium">{registration.workshopName}</h4>
                        <p className="text-sm text-gray-600">Fee: ₹{registration.workshopFee}</p>
                        <p className="text-sm">
                          Status: 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            registration.paymentStatus === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {registration.paymentStatus === 'completed' ? 'Payment Completed' : 'Payment Pending'}
                          </span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            registration.approval === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : registration.approval === 'rejected' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {registration.approval ? `Approval ${registration.approval.charAt(0).toUpperCase() + registration.approval.slice(1)}` : 'Approval Pending'}
                          </span>
                        </p>
                        
                        {registration.paymentStatus === 'pending' && workshop?.paymentLink && (
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => window.open(workshop.paymentLink, "_blank")}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                            >
                              Pay Now
                            </button>
                            <button
                              onClick={() => handleReceiptUpload(registration)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              Upload Receipt
                            </button>
                          </div>
                        )}
                        
                        {registration.receiptUrl && (
                          <div className="mt-2">
                            <a
                              href={registration.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm underline"
                            >
                              View Receipt
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {registeredWorkshops.length < 3 && (
                <button
                  onClick={() => navigate("/workshops")}
                  className="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors text-sm"
                >
                  Browse More Workshops
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
