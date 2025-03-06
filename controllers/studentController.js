import { CourseProgress }  from '../models/CourseProgress.js';
import Course from '../models/Courses.js';
import User from '../models/UserModel.js';
import HttpError from '../utils/httpError.js';

  
  // Get All Courses a student is Enrolled In
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
    const { userId, courseId, lectureId } = req.body;

    // 🔹 Step 1: Validate Course & Lecture
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const totalLectures = course.courseContent.reduce(
        (sum, chapter) => sum + chapter.chapterContent.length, 0
    );

    const lectureExists = course.courseContent.some(chapter =>
        chapter.chapterContent.some(lecture => lecture._id.equals(lectureId))
    );

    if (!lectureExists) return res.status(400).json({ success: false, message: "Lecture not found in this course" });

    // 🔹 Step 2: Update Progress
    let progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
        progress = new CourseProgress({ userId, courseId, lectureCompleted: [lectureId] });
    } else if (!progress.lectureCompleted.includes(lectureId)) {
        progress.lectureCompleted.push(lectureId);
    }

    // 🔹 Step 3: Calculate Progress Percentage
    progress.progressPercentage = (progress.lectureCompleted.length / totalLectures) * 100;
    await progress.save();

    res.status(200).json({
        success: true,
        message: "Progress updated",
        progress: {
            completedLectures: progress.lectureCompleted.length,
            totalLectures,
            progressPercentage: progress.progressPercentage.toFixed(2),
        }
    });

} catch (error) {
    res.status(500).json({ success: false, message: `Error updating progress: ${error.message}` });
}
};


// Get student Course Progress

export const getStudentCourseProgress = async (req, res, next) => {
  try {
    const { userId, courseId } = req.params;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (!progressData) {
      return res.status(404).json({ success: false, message: "No progress found for this course" });
    }

    res.status(200).json({
      success: true,
      progress: {
        courseId,
        completedLectures: progressData.lectureCompleted.length,
        totalLectures: progressData.progressPercentage > 0 ? Math.round((progressData.progressPercentage / 100) * progressData.lectureCompleted.length) : 0,
        progressPercentage: progressData.progressPercentage.toFixed(2),
      },
    });

  } catch (error) {
    return next(new HttpError(`Could not fetch progress: ${error.message}`, 500));
  }
};

/// get progress for all enrolled courses
export const getAllStudentProgress = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find all progress records for this user
    const progressData = await CourseProgress.find({ userId });

    if (!progressData || progressData.length === 0) {
      return res.status(404).json({ success: false, message: "No progress found" });
    }

    res.status(200).json({
      success: true,
      data: progressData.map((progress) => ({
        courseId: progress.courseId,
        completedLectures: progress.lectureCompleted.length,
        progressPercentage: progress.progressPercentage || 0, // Ensure progressPercentage is always included
      })),
    });

  } catch (error) {
    return next(new HttpError(`Could not fetch progress: ${error.message}`, 500));
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


// Enroll a student in a course
export const enrollStudentToCourse = async (req, res, next) => {
  try {
      const userId = req.user.id; // Get logged-in student ID
      const { courseId } = req.body;

      // Validate Course ID
      if (!courseId) return next(new HttpError("Course ID is required", 400));

      const course = await Course.findById(courseId);
      if (!course) return next(new HttpError("Course not found", 404));

      // Check if the student is already enrolled
      if (course.enrolledStudents.includes(userId)) {
          return res.status(400).json({ success: false, message: "Student already enrolled in this course" });
      }

      // Enroll student
      course.enrolledStudents.push(userId);
      await course.save();

      // Initialize course progress
      await CourseProgress.create({ userId, courseId, lectureCompleted: [] });

      res.status(200).json({
          success: true,
          message: "Student successfully enrolled",
          courseId,
          studentId: userId,
      });

  } catch (error) {
      return next(new HttpError(`Enrollment failed: ${error.message}`, 500));
  }
};

//  Unregister a student from a course
export const unregisterStudentFromCourse = async (req, res, next) => {
  try {
      const userId = req.user.id; // Get logged-in student ID
      const { courseId } = req.body;

      //  Validate Course ID
      if (!courseId) return next(new HttpError("Course ID is required", 400));

      const course = await Course.findById(courseId);
      if (!course) return next(new HttpError("Course not found", 404));

      //  Check if student is enrolled
      if (!course.enrolledStudents.includes(userId)) {
          return res.status(400).json({ success: false, message: "You are not enrolled in this course" });
      }

      //  Remove student from enrolled list
      course.enrolledStudents = course.enrolledStudents.filter(id => id.toString() !== userId);
      await course.save();

      //  Delete student's progress record for this course
      await CourseProgress.findOneAndDelete({ userId, courseId });

      res.status(200).json({
          success: true,
          message: "You have successfully unregistered from the course",
      });

  } catch (error) {
      return next(new HttpError(`Unregistration failed: ${error.message}`, 500));
  }
};