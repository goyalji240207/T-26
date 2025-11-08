import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { auth, db, storage } from "../firebase";

const Workshops = () => {
  const [workshops, setWorkshops] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [registeredWorkshops, setRegisteredWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [showWorkshopDetails, setShowWorkshopDetails] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        setUser(null);
        setUserData(null);
        setRegisteredWorkshops([]);
      }
      fetchWorkshops();
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserData(userData);
        
        // Fetch registered workshops
        const registeredWorkshopsRef = collection(db, "registered_workshops", userId, "workshops");
        const registeredWorkshopsSnap = await getDocs(registeredWorkshopsRef);
        const registeredWorkshopsData = registeredWorkshopsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRegisteredWorkshops(registeredWorkshopsData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const workshopsRef = collection(db, "workshops");
      const workshopsQuery = query(workshopsRef);
      const workshopsSnap = await getDocs(workshopsQuery);
      const workshopsData = workshopsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkshops(workshopsData);
    } catch (error) {
      console.error("Error fetching workshops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (workshop) => {
    if (!user) {
      alert("Please login to register for workshops");
      return;
    }

    // Check if already registered for this workshop
    const isAlreadyRegistered = registeredWorkshops.some(reg => reg.workshopId === workshop.id);
    if (isAlreadyRegistered) {
      alert("You are already registered for this workshop");
      return;
    }

    // Check 3-workshop limit
    if (registeredWorkshops.length >= 3) {
      alert("You can register for a maximum of 3 workshops");
      return;
    }

    try {
      // Use the correct workshop name field (either 'name' or 'heading')
      const workshopName = workshop.name || workshop.heading || "Unnamed Workshop";
      
      // Create registration entry
      const registrationData = {
        workshopId: workshop.id,
        workshopName: workshopName,
        workshopFee: workshop.feeStructure || "Not specified",
        paymentLink: workshop.paymentLink || "",
        registrationDate: serverTimestamp(),
        paymentStatus: "pending",
        receiptUrl: "",
        approval: "pending"
      };

      // Add to user's registered workshops
      const userRegistrationRef = doc(db, "registered_workshops", user.uid, "workshops", workshop.id);
      await setDoc(userRegistrationRef, registrationData);

      // Update user's registered_workshops array in users collection
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        registered_workshops: arrayUnion({
          workshopId: workshop.id,
          workshopName: workshopName,
          paymentStatus: "pending",
          approval: "pending"
        })
      });

      alert("Successfully registered for the workshop!");
      fetchUserData(user.uid);
      fetchWorkshops();
    } catch (error) {
      console.error("Error registering for workshop:", error);
      alert("Error registering for workshop. Please try again.");
    }
  };

  const handlePayment = (workshop) => {
    if (!workshop.paymentLink) {
      alert("Payment link not available for this workshop");
      return;
    }
    setSelectedWorkshop(workshop);
    setShowPaymentModal(true);
  };

  const handlePaymentLinkClick = () => {
    if (selectedWorkshop?.paymentLink) {
      window.open(selectedWorkshop.paymentLink, "_blank");
      setShowPaymentModal(false);
      setShowReceiptUpload(true);
    }
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile || !selectedWorkshop || !user) return;

    try {
      // Upload receipt to Firebase Storage
      const storageRef = ref(storage, `workshop_registration/${user.uid}/${selectedWorkshop.id}/${receiptFile.name}`);
      await uploadBytes(storageRef, receiptFile);
      const receiptUrl = await getDownloadURL(storageRef);

      // Update registration with receipt URL and payment status
      const userRegistrationRef = doc(db, "registered_workshops", user.uid, "workshops", selectedWorkshop.id);
      await updateDoc(userRegistrationRef, {
        receiptUrl: receiptUrl,
        paymentStatus: "completed",
        paymentDate: serverTimestamp()
      });

      // Update user's registered_workshops array
      const userRef = doc(db, "users", user.uid);
      const updatedWorkshops = registeredWorkshops.map(reg => 
        reg.workshopId === selectedWorkshop.id 
          ? { ...reg, paymentStatus: "completed" }
          : reg
      );
      await updateDoc(userRef, {
        registered_workshops: updatedWorkshops
      });

      alert("Receipt uploaded successfully! Payment completed.");
      setShowReceiptUpload(false);
      setReceiptFile(null);
      fetchUserData(user.uid);
      fetchWorkshops();
    } catch (error) {
      console.error("Error uploading receipt:", error);
      alert("Error uploading receipt. Please try again.");
    }
  };

  const getRegistrationStatus = (workshop) => {
    if (!user) return "not_registered";
    const registration = registeredWorkshops.find(reg => reg.workshopId === workshop.id);
    if (!registration) return "not_registered";
    return registration.paymentStatus === "completed" ? "payment_completed" : "payment_pending";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading workshops...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Workshops</h1>
          {user && (
            <div className="text-sm text-gray-600">
              Registered: {registeredWorkshops.length}/3 workshops
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops.map((workshop) => {
            const registrationStatus = getRegistrationStatus(workshop);
            
            return (
              <div key={workshop.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {workshop.coverPhotoUrl && (
                  <img 
                    src={workshop.coverPhotoUrl} 
                    alt={workshop.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => {
                        setSelectedWorkshop(workshop);
                        setShowWorkshopDetails(true);
                      }}>
                    {workshop.name || workshop.heading}
                  </h2>
                  
                  <p className="text-gray-600 mb-4">
                    {workshop.about || workshop.description}
                  </p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      <strong>Fee:</strong> {workshop.feeStructure}
                    </p>
                    {workshop.heading && (
                      <p className="text-sm text-gray-500">
                        <strong>Workshop:</strong> {workshop.heading}
                      </p>
                    )}
                  </div>

                  {/* FAQ Section */}
                  {workshop.faqs && workshop.faqs.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">FAQs:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {workshop.faqs.slice(0, 2).map((faq, index) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                            <p className="font-medium text-gray-700">Q: {faq.question}</p>
                            <p className="text-gray-600">A: {faq.answer}</p>
                          </div>
                        ))}
                        {workshop.faqs.length > 2 && (
                          <button
                            onClick={() => {
                              setSelectedWorkshop(workshop);
                              setShowWorkshopDetails(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View {workshop.faqs.length - 2} more FAQs...
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedWorkshop(workshop);
                      setShowWorkshopDetails(true);
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors mb-2"
                  >
                    View Details
                  </button>

                  {!user ? (
                    <button
                      onClick={() => navigate("/")}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                    >
                      Login to Register
                    </button>
                  ) : (
                    <div>
                      {registrationStatus === "not_registered" && (
                        <>
                          {registeredWorkshops.length >= 3 ? (
                            <div className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded text-center">
                              You have registered for 3 workshops
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRegister(workshop)}
                              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                            >
                              Register
                            </button>
                          )}
                        </>
                      )}
                      
                      {registrationStatus === "payment_pending" && (
                        <button
                          onClick={() => handlePayment(workshop)}
                          className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
                        >
                          Pay Now
                        </button>
                      )}
                      
                      {registrationStatus === "payment_completed" && (
                        <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded text-center">
                          Payment Completed ✓
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Payment Instructions</h3>
            <p className="text-gray-600 mb-4">
              Click the button below to proceed to the payment page. After completing the payment, 
              you will need to upload your payment receipt.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handlePaymentLinkClick}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Go to Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload Payment Receipt</h3>
            <p className="text-gray-600 mb-4">
              Please upload your payment receipt as proof of payment.
            </p>
            <div className="mb-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files[0])}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleReceiptUpload}
                disabled={!receiptFile}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors disabled:bg-gray-300"
              >
                Upload Receipt
              </button>
              <button
                onClick={() => {
                  setShowReceiptUpload(false);
                  setReceiptFile(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workshop Details Modal */}
      {showWorkshopDetails && selectedWorkshop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedWorkshop.name || selectedWorkshop.heading}
                </h2>
                <button
                  onClick={() => setShowWorkshopDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedWorkshop.coverPhotoUrl && (
                <img 
                  src={selectedWorkshop.coverPhotoUrl} 
                  alt={selectedWorkshop.name || selectedWorkshop.heading}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">
                    {selectedWorkshop.about || selectedWorkshop.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Fee Structure</h4>
                    <p className="text-gray-600">{selectedWorkshop.feeStructure}</p>
                  </div>
                  
                  {selectedWorkshop.heading && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Workshop Heading</h4>
                      <p className="text-gray-600">{selectedWorkshop.heading}</p>
                    </div>
                  )}
                </div>

                {selectedWorkshop.faqs && selectedWorkshop.faqs.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {selectedWorkshop.faqs.map((faq, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-gray-800">Q: {faq.question}</h4>
                          <p className="text-gray-600 mt-1">A: {faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedWorkshop.paymentLink && (
                  <div className="pt-4 border-t border-gray-200">
                    <a
                      href={selectedWorkshop.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Go to Payment Link →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workshops;