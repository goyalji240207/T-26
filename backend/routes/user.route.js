import express from 'express';
import { getAllUsers, getUserById, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

// Get all users
router.get('/users', getAllUsers);

// Get user by ID
router.get('/users/:userId', getUserById);

// Delete user by ID
router.delete('/users/:userId', deleteUser);

export default router;