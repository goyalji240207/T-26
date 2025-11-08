const express = require('express');
const { getAllUsers, getUserById, deleteUser } = require('../controllers/user.controller.js');
const { authenticateAdmin } = require('../middleware/auth.middleware.js');

const router = express.Router();

// All user routes require admin authentication
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/users/:userId', authenticateAdmin, getUserById);
router.delete('/users/:userId', authenticateAdmin, deleteUser);

module.exports = router;