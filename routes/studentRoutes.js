import express from 'express'; 
import { 
    studentEnrolledCourses, 
    updateStudentCourseProgress, 
    getStudentCourseProgress, 
    addStudentRating,
    getAllStudentProgress 
} from '../controllers/studentController.js'; 
import { protect } from '../controllers/authController.js';

const router = express.Router();

// 🔹 Get student enrolled courses
router.get('/courses', protect, studentEnrolledCourses);

// 🔹 Update student course progress
router.post('/update-course-progress', protect, updateStudentCourseProgress);

// 🔹 Get student's progress for a specific course
router.get('/course-progress/:userId/:courseId', protect, getStudentCourseProgress);

// 🔹 Get progress for all courses a student is enrolled in
router.get('/course-progress/:userId', protect, getAllStudentProgress);

// 🔹 Allow students to rate a course
router.post('/rate', protect, addStudentRating);

export default router;