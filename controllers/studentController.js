import Course from '../models/Courses.js';
import User from '../models/UserModel.js';
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


// Update student Course Progress
export const updateStudentCourseProgress = async (req, res, next) => {
  try {
    const userId = req.user.id; // Corrected authentication reference
    const { courseId, lectureId } = req.body;

    // 🔹 Find existing progress for the user and course
    let progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      // 🔹 Check if lecture is already completed
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res.status(200).json({ success: false, message: 'Lecture already completed' });
      }

      // 🔹 Add new lecture to completed list
      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      // 🔹 Create new progress entry if it doesn't exist
      progressData = await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId]
      });
    }

    // 🔹 Check if all lectures are completed & mark course as completed
    const course = await Course.findById(courseId);
    if (course) {
      const totalLectures = course.courseContent.reduce((sum, chapter) => sum + chapter.chapterContent.length, 0);
      if (progressData.lectureCompleted.length === totalLectures) {
        progressData.completed = true;
        await progressData.save();
      }
    }

    res.status(200).json({ success: true, message: 'Progress Updated' });

  } catch (error) {
    return next(new HttpError(`Could not update progress: ${error.message}`, 500));
  }
};


// Get student Course Progress
export const getStudentCourseProgress = async (req, res, next) => {
  try {
      const userId = req.user.id; // ✅ Corrected authentication reference
      const { courseId } = req.params; // ✅ Get courseId from URL parameters

      // 🔹 Find progress for this user and course
      const progressData = await CourseProgress.findOne({ userId, courseId });

      // 🔹 If no progress exists, return 404
      if (!progressData) {
          return res.status(404).json({ success: false, message: 'No progress found for this course' });
      }

      res.status(200).json({ success: true, progressData });

  } catch (error) {
      return next(new HttpError(`Could not retrieve progress: ${error.message}`, 500));
  }
};


// Add Student Ratings to Course
export const addStudentRating = async (req, res) => {
  try {
      const userId = req.user.id; // ✅ Corrected authentication reference
      const { courseId, rating } = req.body;

      // 🔹 Validate input
      if (!courseId || !rating || rating < 1 || rating > 5) {
          return res.status(400).json({ success: false, message: 'Invalid rating details' });
      }

      // 🔹 Find course
      const course = await Course.findById(courseId);
      if (!course) {
          return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // 🔹 Check if user is enrolled in the course
      if (!course.enrolledStudents.includes(userId)) {
          return res.status(403).json({ success: false, message: 'User has not enrolled in this course' });
      }

      // 🔹 Find existing rating
      const existingRatingIndex = course.courseRatings.findIndex(r => r.userId.toString() === userId);

      if (existingRatingIndex > -1) {
          // ✅ Update existing rating
          course.courseRatings[existingRatingIndex].rating = rating;
      } else {
          // ✅ Add new rating
          course.courseRatings.push({ userId, rating });
      }

      // 🔹 Save updated course
      await course.save();
      res.status(200).json({ success: true, message: 'Rating added successfully' });

  } catch (error) {
      res.status(500).json({ success: false, message: `Could not add rating: ${error.message}` });
  }
};