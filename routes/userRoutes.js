import express from 'express';
import { getAllUsers, updateUser, deleteUser, getLoginUser} from '../controllers/usersController.js'; // Ensure named exports are used
import { protect } from '../controllers/authController.js';

const router = express.Router();



router.get('/users', getAllUsers)
router.get("/me", protect, getLoginUser);
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)


export default router;