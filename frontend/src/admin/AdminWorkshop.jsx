import React, { useState, useEffect } from 'react';
import { storage, ref, uploadBytes, getDownloadURL, deleteObject } from '../firebase.js';
import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const AdminWorkshop = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [formData, setFormData] = useState({
    heading: '',
    about: '',
    paymentLink: '',
    feeStructure: '',
    coverPhoto: null,
    faqs: [{ question: '', answer: '' }]
  });

  // Get current user and ID token
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const token = await currentUser.getIdToken();
        setIdToken(token);
      } else {
        setUser(null);
        setIdToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch workshops
  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/workshops');
      const data = await response.json();
      
      if (data.success) {
        setWorkshops(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch workshops');
      console.error('Error fetching workshops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size too large. Maximum size is 5MB.');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        coverPhoto: file
      }));
      
      console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };

  const uploadCoverPhoto = async (file) => {
    try {
      const timestamp = Date.now();
      const fileName = `workshops/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      console.log('Uploading to:', fileName);
      console.log('Storage bucket:', storage.app.options.storageBucket);
      
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload completed:', snapshot);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Upload error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  const deleteCoverPhoto = async (photoUrl) => {
    if (!photoUrl) return;

    try {
      // Decode the URL to handle special characters in the file name
      const decodedUrl = decodeURIComponent(photoUrl);

      // Extract the file path from the URL
      const urlParts = decodedUrl.split('/o/');
      if (urlParts.length < 2) {
        console.error('Invalid photo URL format:', photoUrl);
        return;
      }

      const filePathWithQuery = urlParts[1];
      const filePath = filePathWithQuery.split('?')[0];

      console.log('Attempting to delete cover photo from path:', filePath);
      const storageRef = ref(storage, filePath);

      await deleteObject(storageRef);
      console.log('Cover photo deleted successfully:', filePath);
    } catch (error) {
      console.error('Error deleting cover photo:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      // Don't throw error - continue with the operation even if deletion fails
    }
  };

  const handleFAQChange = (index, field, value) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData(prev => ({
      ...prev,
      faqs: newFaqs
    }));
  };

  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }));
  };

  const removeFAQ = (index) => {
    const newFaqs = formData.faqs.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      faqs: newFaqs
    }));
  };

  const resetForm = () => {
    setFormData({
      heading: '',
      about: '',
      paymentLink: '',
      feeStructure: '',
      coverPhoto: null,
      faqs: [{ question: '', answer: '' }]
    });
    setEditingWorkshop(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!idToken) {
      alert('You must be logged in to perform this action');
      return;
    }

    let coverPhotoUrl = null;
    let oldCoverPhotoToDelete = null;
    
    // Upload cover photo if a new file is selected
    if (formData.coverPhoto && formData.coverPhoto instanceof File) {
      try {
        console.log('Uploading cover photo...');
        coverPhotoUrl = await uploadCoverPhoto(formData.coverPhoto);
        console.log('Cover photo uploaded successfully:', coverPhotoUrl);
        
        // Mark old photo for deletion if we're editing and had an old photo
        if (editingWorkshop && editingWorkshop.coverPhoto) {
          oldCoverPhotoToDelete = editingWorkshop.coverPhoto;
          console.log('Will delete old cover photo after successful update:', oldCoverPhotoToDelete);
        }
      } catch (error) {
        alert('Failed to upload cover photo. Please try again.');
        console.error('Cover photo upload failed:', error);
        return;
      }
    }

    // Prepare the data to send to backend
    const workshopData = {
      heading: formData.heading,
      about: formData.about,
      paymentLink: formData.paymentLink,
      faqs: formData.faqs
    };
    
    // Only add feeStructure if it's not empty
    if (formData.feeStructure && formData.feeStructure.trim() !== '') {
      workshopData.feeStructure = formData.feeStructure;
    }
    
    // Add cover photo URL if we have one (either from upload or existing)
    if (coverPhotoUrl) {
      workshopData.coverPhoto = coverPhotoUrl;
    } else if (editingWorkshop && editingWorkshop.coverPhoto && !formData.coverPhoto) {
      // Keep existing cover photo if editing and no new photo selected
      workshopData.coverPhoto = editingWorkshop.coverPhoto;
    }

    try {
      const url = editingWorkshop 
        ? `http://localhost:5000/api/workshops/${editingWorkshop.id}`
        : 'http://localhost:5000/api/workshops';
      
      const method = editingWorkshop ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workshopData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Delete old cover photo if we successfully updated with a new one
        if (oldCoverPhotoToDelete) {
          console.log('Deleting old cover photo after successful update...');
          await deleteCoverPhoto(oldCoverPhotoToDelete);
        }
        
        alert(`Workshop ${editingWorkshop ? 'updated' : 'created'} successfully!`);
        resetForm();
        fetchWorkshops();
      } else {
        // If update failed but we uploaded a new photo, delete the new one to avoid orphaned files
        if (coverPhotoUrl) {
          console.log('Update failed, deleting newly uploaded cover photo...');
          await deleteCoverPhoto(coverPhotoUrl);
        }
        alert(`Failed to ${editingWorkshop ? 'update' : 'create'} workshop: ${data.message}`);
      }
    } catch (err) {
      alert(`Error ${editingWorkshop ? 'updating' : 'creating'} workshop`);
      console.error('Error:', err);
    }
  };

  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      heading: workshop.heading,
      about: workshop.about,
      paymentLink: workshop.paymentLink,
      feeStructure: workshop.feeStructure,
      coverPhoto: null,
      faqs: workshop.faqs || [{ question: '', answer: '' }]
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (workshopId) => {
    if (!confirm('Are you sure you want to delete this workshop?')) {
      return;
    }

    if (!idToken) {
      alert('You must be logged in to perform this action');
      return;
    }

    try {
      // First, get the workshop data to find the cover photo URL
      const getWorkshopResponse = await fetch(`http://localhost:5000/api/workshops/${workshopId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const workshopData = await getWorkshopResponse.json();
      const coverPhotoUrl = workshopData.data?.coverPhoto;

      // Delete the workshop from backend
      const deleteResponse = await fetch(`http://localhost:5000/api/workshops/${workshopId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await deleteResponse.json();
      
      if (data.success) {
        // Delete cover photo from storage if it exists (do this after successful workshop deletion)
        if (coverPhotoUrl) {
          console.log('Deleting cover photo from storage:', coverPhotoUrl);
          await deleteCoverPhoto(coverPhotoUrl);
        }
        
        alert('Workshop deleted successfully!');
        fetchWorkshops();
      } else {
        alert(`Failed to delete workshop: ${data.message}`);
      }
    } catch (err) {
      alert('Error deleting workshop');
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workshop Management</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Workshop
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Workshop Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingWorkshop ? 'Edit Workshop' : 'Create New Workshop'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workshop Heading *
                  </label>
                  <input
                    type="text"
                    name="heading"
                    value={formData.heading}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About Workshop *
                  </label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Link *
                  </label>
                  <input
                    type="url"
                    name="paymentLink"
                    value={formData.paymentLink}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Structure
                  </label>
                  <textarea
                    name="feeStructure"
                    value={formData.feeStructure}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.coverPhoto && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ New photo selected: {formData.coverPhoto.name} ({Math.round(formData.coverPhoto.size / 1024)}KB)
                    </p>
                  )}
                  {editingWorkshop && editingWorkshop.coverPhoto && !formData.coverPhoto && (
                    <p className="text-sm text-gray-500 mt-1">
                      Current photo: {editingWorkshop.coverPhoto.split('/').pop()}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      FAQs
                    </label>
                    <button
                      type="button"
                      onClick={addFAQ}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Add FAQ
                    </button>
                  </div>
                  
                  {formData.faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">FAQ {index + 1}</span>
                        {formData.faqs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFAQ(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Question"
                        value={faq.question}
                        onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea
                        placeholder="Answer"
                        value={faq.answer}
                        onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingWorkshop ? 'Update Workshop' : 'Create Workshop'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Workshops List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops.map((workshop) => (
            <div key={workshop.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {workshop.coverPhoto && (
                <img
                  src={workshop.coverPhoto}
                  alt={workshop.heading}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {workshop.heading}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {workshop.about}
                </p>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    <strong>Fee:</strong> {workshop.feeStructure}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>FAQs:</strong> {workshop.faqs?.length || 0}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <a
                    href={workshop.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Payment Link →
                  </a>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(workshop)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(workshop.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {workshops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No workshops found.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Your First Workshop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorkshop;