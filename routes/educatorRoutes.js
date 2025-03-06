import express from 'express';
import { addCourse, getEducatorCourses, updateEducator, updateCourse, deleteCourse } from '../controllers/educatorController.js'; 
import upload from '../configs/multer.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();



//update educator details
router.patch('/updateMe',updateEducator)

//update educator details
router.post('/add-course',upload.single('image'),protect, addCourse)


//get educator courses
router.get('/courses', protect, getEducatorCourses)

// ✅ Update Course Route
router.patch('/:courseId', protect, upload.single('image'), updateCourse);





// ✅ Delete Course Route
router.delete('/:courseId', protect, deleteCourse);


export default router;