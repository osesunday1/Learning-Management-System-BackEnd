import express from 'express';
import { studentEnrolledCourses } from '../controllers/studentController.js'; 
import { protect } from '../controllers/authController.js';


const router = express.Router();


//get student courses
router.get('/courses', protect, studentEnrolledCourses)


export default router;