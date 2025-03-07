import Course from "../models/Courses.js";
import HttpError from '../utils/httpError.js';

// Get All Published Courses
export const getAllCourse = async (req, res, next) => {
    try {
        // 🔹 Find all courses that are published (`isPublished: true`)
        const data = await Course.find({ isPublished: true })
            // 🔹 Exclude `courseContent` and `enrolledStudents` fields from the result
            .select(['-courseContent',]) 
            // 🔹 Populate `educator` field with full user details instead of just id
            .populate({ path: 'educator' });
  
        // 🔹 Send the retrieved courses as a JSON response
        res.status(200).json({ success: true, data });
  
    } catch (error) {
        // 🔹 Handle any server error and pass it to the next middleware
        return next(new HttpError(`Could not fetch courses: ${error.message}`, 500));
    }
  };



  // Get Course by ID
export const getCourseId = async (req, res, next) => {
    try {
        const { id } = req.params;
  
        // 🔹 Retrieve course and populate educator details
        const courseData = await Course.findById(id).populate({ path: 'educator' });
  
        // 🔹 If course is not found, return 404 error
        if (!courseData) {
            return next(new HttpError('Course not found', 404));
        }
  
        // 🔹 Modify course content to hide lecture URLs if `isPreviewFree` is false
        courseData.courseContent = courseData.courseContent.map(chapter => {
            chapter.chapterContent = chapter.chapterContent.map(lecture => {
                if (!lecture.isPreviewFree) {
                    return { ...lecture, lectureUrl: "" }; // Hide lecture URL
                }
                return lecture;
            });
            return chapter;
        });
  
        // 🔹 Send course data as response
        res.status(200).json({
            success: true,
            data: courseData
        });
  
    } catch (error) {
        // 🔹 Handle errors properly
        return next(new HttpError(`Could not retrieve course: ${error.message}`, 500));
    }
  };


  // Get all students enrolled in a specific course
export const getEnrolledStudents = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        //  Find the course
        const course = await Course.findById(courseId).populate("enrolledStudents", "name email imageUrl createdAt");

        if (!course) {
            return next(new HttpError("Course not found", 404));
        }

        //  Prepare response data
        const enrolledStudents = course.enrolledStudents.map(student => ({
            student: {
                name: student.name,
                email: student.email,
                imageUrl: student.imageUrl || "/default-avatar.png",
            },
            courseTitle: course.courseTitle,
            purchaseDate: student.createdAt, // Assuming 'createdAt' is when the student signed up
        }));

        res.status(200).json({ success: true, enrolledStudents });
    } catch (error) {
        return next(new HttpError(`Could not fetch enrolled students: ${error.message}`, 500));
    }
};