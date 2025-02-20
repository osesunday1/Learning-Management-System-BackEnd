import express from 'express';
import { signup, login, forgotPassword, resetPassword, updatePassword, protect } from '../controllers/authController.js'; // Ensure named exports are used


const router = express.Router();




router.post('/signup', signup)
router.post('/login', login)

router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

router.patch('/updateMyPassword', protect ,updatePassword)



export default router;