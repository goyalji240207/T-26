const { db, bucket } = require('../firebase.js');
const { v4: uuidv4 } = require('uuid');

// Log bucket information for debugging
console.log('Firebase bucket initialized:', bucket ? 'Yes' : 'No');
if (bucket) {
  console.log('Bucket name:', bucket.name);
}

// Function to get the correct bucket with fallback
const getStorageBucket = () => {
  if (bucket) {
    return bucket;
    
  }
  
  // Fallback: try to get bucket from admin SDK
  try {
    const admin = require('firebase-admin');
    return admin.storage().bucket();
  } catch (error) {
    console.error('Failed to get storage bucket:', error);
    return null;
  }
};

// Create a new workshop
const createWorkshop = async (req, res) => {
  try {
    const { heading, about, paymentLink, feeStructure, faqs, coverPhoto } = req.body;

    // Validate required fields
    if (!heading || !about || !paymentLink) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: heading, about, or paymentLink'
      });
    }

    // Create workshop data
    const workshopData = {
      heading,
      about,
      paymentLink,
      feeStructure: feeStructure || null, // Handle undefined feeStructure
      coverPhoto: coverPhoto || null, // coverPhoto is now a URL string
      faqs: faqs || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid
    };



    // Add to Firestore
    const docRef = await db.collection('workshops').add(workshopData);

    res.status(201).json({
      success: true,
      message: 'Workshop created successfully',
      data: {
        id: docRef.id,
        ...workshopData
      }
    });
  } catch (error) {
    console.error('Create workshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workshop',
      error: error.message
    });
  }
};

// Get all workshops
const getAllWorkshops = async (req, res) => {
  try {
    const workshopsSnapshot = await db.collection('workshops')
      .orderBy('createdAt', 'desc')
      .get();

    const workshops = [];
    workshopsSnapshot.forEach(doc => {
      workshops.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json({
      success: true,
      message: 'Workshops retrieved successfully',
      data: workshops
    });
  } catch (error) {
    console.error('Get workshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve workshops',
      error: error.message
    });
  }
};

// Get a single workshop by ID
const getWorkshopById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const workshopDoc = await db.collection('workshops').doc(id).get();
    
    if (!workshopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workshop retrieved successfully',
      data: {
        id: workshopDoc.id,
        ...workshopDoc.data()
      }
    });
  } catch (error) {
    console.error('Get workshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve workshop',
      error: error.message
    });
  }
};

// Update a workshop
const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, about, paymentLink, feeStructure, faqs, coverPhoto } = req.body;

    // Validate required fields
    if (!heading || !about || !paymentLink) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: heading, about, or paymentLink'
      });
    }

    // Get existing workshop
    const workshopDoc = await db.collection('workshops').doc(id).get();
    
    if (!workshopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    const existingWorkshop = workshopDoc.data();
    let coverPhotoUrl = existingWorkshop.coverPhoto;

    // Handle cover photo replacement if provided (now it's a URL string)
    if (coverPhoto) {
      coverPhotoUrl = coverPhoto;
      console.log('Updated cover photo URL:', coverPhotoUrl);
    }

    // Prepare update data
    const updateData = {
      heading: heading || existingWorkshop.heading,
      about: about || existingWorkshop.about,
      paymentLink: paymentLink || existingWorkshop.paymentLink,
      feeStructure: feeStructure !== undefined ? feeStructure : existingWorkshop.feeStructure,
      coverPhoto: coverPhotoUrl,
      faqs: faqs || existingWorkshop.faqs,
      updatedAt: new Date()
    };

    // Update in Firestore
    await db.collection('workshops').doc(id).update(updateData);

    res.status(200).json({
      success: true,
      message: 'Workshop updated successfully',
      data: {
        id,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Update workshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workshop',
      error: error.message
    });
  }
};

// Delete a workshop
const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing workshop
    const workshopDoc = await db.collection('workshops').doc(id).get();
    
    if (!workshopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    const workshopData = workshopDoc.data();

    // Note: Cover photo deletion is now handled from frontend
    // to avoid backend storage access issues

    // Delete from Firestore
    await db.collection('workshops').doc(id).delete();

    res.status(200).json({
      success: true,
      message: 'Workshop deleted successfully'
    });
  } catch (error) {
    console.error('Delete workshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workshop',
      error: error.message
    });
  }
};

module.exports = {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
  // Admin: registrations management
  getAllWorkshopRegistrations: async (req, res) => {
    try {
      // Query all registrations from collection group 'workshops' under 'registered_workshops/{userId}/workshops/{workshopId}'
      const registrationsSnap = await db.collectionGroup('workshops').get();

      const registrations = [];
      for (const docSnap of registrationsSnap.docs) {
        const regData = docSnap.data();
        const workshopId = regData.workshopId;

        // Determine if this 'workshops' doc is under 'registered_workshops/{userId}/workshops'
        const collectionRef = docSnap.ref.parent; // 'workshops' collection
        const parentDocRef = collectionRef.parent; // DocumentRef of 'registered_workshops/{userId}' OR null for root-level 'workshops'
        const rootCollectionRef = parentDocRef?.parent; // CollectionRef of 'registered_workshops' OR undefined

        // Skip top-level 'workshops' documents (actual workshop definitions)
        if (!rootCollectionRef || rootCollectionRef.id !== 'registered_workshops') {
          continue;
        }

        const userId = parentDocRef.id;

        // Fetch user details
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Fetch workshop details (optional)
        const workshopDoc = await db.collection('workshops').doc(workshopId).get();
        const workshopData = workshopDoc.exists ? workshopDoc.data() : {};

        registrations.push({
          id: docSnap.id,
          userId,
          userName: userData.name || '',
          userEmail: userData.email || '',
          userPhone: userData.phone || '',
          userTechId: userData.techid || '',
          workshopId,
          workshopName: regData.workshopName || workshopData.heading || 'Workshop',
          workshopFee: regData.workshopFee || workshopData.feeStructure || '',
          paymentStatus: regData.paymentStatus || 'pending',
          registrationDate: regData.registrationDate || null,
          paymentDate: regData.paymentDate || null,
          receiptUrl: regData.receiptUrl || null,
          paymentLink: regData.paymentLink || workshopData.paymentLink || null,
          approval: regData.approval || 'pending',
          workshopDate: workshopData.date || null,
          workshopTime: workshopData.time || null,
          workshopLocation: workshopData.location || null
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Workshop registrations retrieved successfully',
        data: registrations
      });
    } catch (error) {
      console.error('Get workshop registrations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve workshop registrations',
        error: error.message
      });
    }
  },

  updateWorkshopApproval: async (req, res) => {
    try {
      const { userId, workshopId } = req.params;
      const { status } = req.body;

      const allowed = ['approved', 'rejected', 'pending'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Allowed: approved, rejected, pending'
        });
      }

      const regRef = db.collection('registered_workshops').doc(userId).collection('workshops').doc(workshopId);
      const regDoc = await regRef.get();
      if (!regDoc.exists) {
        return res.status(404).json({ success: false, message: 'Registration not found' });
      }

      await regRef.update({
        approval: status,
        approvalDate: new Date(),
        approvedBy: req.user?.uid || null
      });

      return res.status(200).json({ success: true, message: 'Approval status updated' });
    } catch (error) {
      console.error('Update workshop approval error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update approval status',
        error: error.message
      });
    }
  }
};