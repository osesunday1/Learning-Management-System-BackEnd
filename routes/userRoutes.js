import express from 'express';
import { getAllUsers, updateUser, deleteUser } from '../controllers/usersController.js'; // Ensure named exports are used

const router = express.Router();



router.get('/users', getAllUsers)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)


export default router;