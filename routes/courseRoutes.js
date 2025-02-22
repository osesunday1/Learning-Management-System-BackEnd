import express from 'express';
import { getCourseId, getAllCourse } from '../controllers/courseController.js'; 


const router = express.Router();


//get all courses
router.get('/', getAllCourse)

//get particular
router.get('/:id', getCourseId)




export default router;