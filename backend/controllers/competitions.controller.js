const { db, bucket } = require('../firebase.js');
const { v4: uuidv4 } = require('uuid');

// Debug Firebase bucket
console.log('Firebase bucket initialized:', bucket ? 'Yes' : 'No');
if (bucket) console.log('Bucket name:', bucket.name);

// Helper function to get bucket safely
const getStorageBucket = () => {
  if (bucket) return bucket;
  try {
    const admin = require('firebase-admin');
    return admin.storage().bucket();
  } catch (error) {
    console.error('Failed to get storage bucket:', error);
    return null;
  }
};

/* ==========================================================
   🔹 CREATE COMPETITION (Admin)
   ========================================================== */
const createCompetition = async (req, res) => {
  try {
    const { section, subsection, name, prize, coverPhoto, explore, description, lastDate } = req.body;

    if (!section || !subsection || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: section, subsection, or name.'
      });
    }

    const competitionData = {
      name,
      prize: prize || '',
      coverPhoto: coverPhoto || null,
      explore: explore || '',
      description: description || '',
      lastDate: lastDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.uid || null
    };

    const collectionPath = `competitions/${section}/${subsection}`;
    const docRef = await db.collection(collectionPath).add(competitionData);

    res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      data: { id: docRef.id, ...competitionData }
    });
  } catch (error) {
    console.error('Create competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create competition',
      error: error.message
    });
  }
};

/* ==========================================================
   🔹 GET ALL COMPETITIONS (Grouped by Section/Subsection)
   ========================================================== */
const getAllCompetitions = async (req, res) => {
  try {
    const sections = ['technical', 'entrepreneurial', 'miscellaneous'];
    const data = {};

    for (const section of sections) {
      const subsectionsSnap = await db.collection(`competitions/${section}`).listDocuments();
      data[section] = {};

      for (const subsectionRef of subsectionsSnap) {
        const subsectionId = subsectionRef.id;
        const compsSnap = await subsectionRef.listCollections();

        // If subsections have nested competitions
        if (compsSnap.length === 0) {
          const eventsSnap = await db.collection(`competitions/${section}/${subsectionId}`).get();
          const events = eventsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          data[section][subsectionId] = events;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Competitions fetched successfully',
      data
    });
  } catch (error) {
    console.error('Get competitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competitions',
      error: error.message
    });
  }
};

/* ==========================================================
   🔹 GET COMPETITIONS BY SUBSECTION (e.g., hackathon)
   ========================================================== */
const getCompetitionsBySubsection = async (req, res) => {
  try {
    const { section, subsection } = req.params;

    const path = `competitions/${section}/${subsection}`;
    const snapshot = await db.collection(path).get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No competitions found for this subsection.'
      });
    }

    const competitions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      message: 'Competitions retrieved successfully',
      data: competitions
    });
  } catch (error) {
    console.error('Get competitions by subsection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get competitions',
      error: error.message
    });
  }
};

/* ==========================================================
   🔹 GET SINGLE COMPETITION DETAILS
   ========================================================== */
const getCompetitionById = async (req, res) => {
  try {
    const { section, subsection, id } = req.params;
    const docRef = db.collection(`competitions/${section}/${subsection}`).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Competition retrieved successfully',
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    console.error('Get competition by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get competition',
      error: error.message
    });
  }
};

/* ==========================================================
   🔹 UPDATE COMPETITION (Admin)
   ========================================================== */
const updateCompetition = async (req, res) => {
  try {
    const { section, subsection, id } = req.params;
    const { name, prize, coverPhoto, explore, description, lastDate } = req.body;

    const docRef = db.collection(`competitions/${section}/${subsection}`).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found.'
      });
    }

    const existing = doc.data();

    const updateData = {
      name: name || existing.name,
      prize: prize || existing.prize,
      coverPhoto: coverPhoto || existing.coverPhoto,
      explore: explore || existing.explore,
      description: description || existing.description,
      lastDate: lastDate || existing.lastDate,
      updatedAt: new Date()
    };

    await docRef.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Competition updated successfully',
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error('Update competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update competition',
      error: error.message
    });
  }
};

/* ==========================================================
   🔹 DELETE COMPETITION (Admin)
   ========================================================== */
const deleteCompetition = async (req, res) => {
  try {
    const { section, subsection, id } = req.params;

    const docRef = db.collection(`competitions/${section}/${subsection}`).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found.'
      });
    }

    await docRef.delete();

    res.status(200).json({
      success: true,
      message: 'Competition deleted successfully'
    });
  } catch (error) {
    console.error('Delete competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete competition',
      error: error.message
    });
  }
};

module.exports = {
  createCompetition,
  getAllCompetitions,
  getCompetitionsBySubsection,
  getCompetitionById,
  updateCompetition,
  deleteCompetition
};
