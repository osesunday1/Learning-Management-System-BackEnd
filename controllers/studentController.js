import Course from '../models/Courses.js';
import HttpError from '../utils/httpError.js';

  
  // Get All Courses a User is Enrolled In
  export const studentEnrolledCourses = async (req, res, next) => {
    try {
        const userId = req.user.id; // Get the authenticated user ID
  
        // 🔹 Find all courses where the user is in enrolledStudents
        const enrolledCourses = await Course.find({ enrolledStudents: userId });
  
        res.status(200).json({ success: true, enrolledCourses });
  
    } catch (error) {
        return next(new HttpError(`Could not fetch enrolled courses: ${error.message}`, 500));
    }
  };