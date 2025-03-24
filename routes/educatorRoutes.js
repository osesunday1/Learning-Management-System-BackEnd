import express from 'express';
import { addCourse, getEducatorCourses, updateEducator, updateCourse, deleteCourse } from '../controllers/educatorController.js'; 
import upload from '../configs/multer.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// ✅ Update Educator Details
router.patch('/updateMe', updateEducator);

// ✅ Add Course with Image, Course Docs, and Lecture Docs
router.post(
    '/add-course',
    protect,
    upload.fields([
        { name: "image", maxCount: 1 }, // Course Thumbnail
        { name: "documents", maxCount: 5 }, // Course Materials (Syllabus, Notes)
        { name: "lectureFiles", maxCount: 20 }, // ✅ Multiple Lecture Documents (PDFs, DOCX, PPTX per lecture)
    ]), 
    addCourse
);
// ✅ Get Educator Courses
router.get('/courses', protect, getEducatorCourses);

// ✅ Update Course Route (Allows Updating Course Thumbnail)
router.patch('/:courseId', protect, upload.single('image'), updateCourse);

// ✅ Delete Course Route
router.delete('/:courseId', protect, deleteCourse);

export default router;