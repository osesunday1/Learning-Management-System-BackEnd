import express from 'express';
import { studentEnrolledCourses, updateStudentCourseProgress, getStudentCourseProgress, addStudentRating } from '../controllers/studentController.js'; 
import { protect } from '../controllers/authController.js';


const router = express.Router();


//get student courses
router.get('/courses', protect, studentEnrolledCourses)

//update student courses
router.post('/update-course-progress', updateStudentCourseProgress)

//get student courses progress
router.get('/progress/:courseId', protect, getStudentCourseProgress);

// 🔹 Allow students to rate a course
router.post('/rate', protect, addStudentRating);


export default router;