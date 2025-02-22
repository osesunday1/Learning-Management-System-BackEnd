import express from 'express';
import { addCourse, getEducatorCourses, updateEducator } from '../controllers/educatorController.js'; 
import upload from '../configs/multer.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();



//update educator details
router.patch('/updateMe',updateEducator)

//update educator details
router.post('/add-course',upload.single('image'),protect, addCourse)


//get educator courses
router.get('/courses', protect, getEducatorCourses)


export default router;