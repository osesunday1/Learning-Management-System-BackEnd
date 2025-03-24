import express from 'express';
import { signup, login, forgotPassword, resetPassword, updatePassword, protect } from '../controllers/authController.js'; // Ensure named exports are used
import upload from '../configs/multer.js';

const router = express.Router();




// Signup with file upload
router.post('/signup', upload.single("photo"), signup);
router.post('/login', login)

router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

router.patch('/updateMyPassword', protect ,updatePassword)



export default router;