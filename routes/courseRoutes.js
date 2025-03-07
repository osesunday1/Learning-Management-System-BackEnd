import express from 'express';
import { getCourseId, getAllCourse, getEnrolledStudents } from '../controllers/courseController.js'; 
import { protect } from '../controllers/authController.js';


const router = express.Router();


//get all courses
router.get('/', getAllCourse)

//get particular
router.get('/:id', getCourseId)

// Get all students enrolled in a course
router.get("/:courseId/students", protect, getEnrolledStudents);


export default router;