const express = require('express');
const { authenticateAdmin } = require('../middleware/auth.middleware.js');
const {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
  getAllWorkshopRegistrations,
  updateWorkshopApproval
} = require('../controllers/workshop.controller.js');

const router = express.Router();

// Workshop routes
// Public routes (no authentication required)
router.get('/', getAllWorkshops);
router.get('/:id', getWorkshopById);

// Admin routes (authentication required)
router.post('/', authenticateAdmin, createWorkshop);
router.put('/:id', authenticateAdmin, updateWorkshop);
router.delete('/:id', authenticateAdmin, deleteWorkshop);

// Admin: registrations management
router.get('/registrations/workshops', authenticateAdmin, getAllWorkshopRegistrations);
router.patch('/registrations/workshops/:userId/:workshopId/approval', authenticateAdmin, updateWorkshopApproval);

module.exports = router;