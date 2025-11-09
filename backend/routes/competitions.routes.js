const express = require('express');
const {
  createCompetition,
  getAllCompetitions,
  getCompetitionsBySubsection,
  getCompetitionById,
  updateCompetition,
  deleteCompetition
} = require('../controllers/competitions.controller.js');

const router = express.Router();

// Create new competition
router.post('/', createCompetition);

// Get all competitions grouped by section/subsection
router.get('/', getAllCompetitions);

// Get all competitions under a subsection
router.get('/:section/:subsection', getCompetitionsBySubsection);

// Get single competition
router.get('/:section/:subsection/:id', getCompetitionById);

// Update competition
router.put('/:section/:subsection/:id', updateCompetition);

// Delete competition
router.delete('/:section/:subsection/:id', deleteCompetition);

module.exports = router;
