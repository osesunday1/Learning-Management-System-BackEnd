import Course from "../models/Courses.js";


// Get All Published Courses
export const getAllCourse = async (req, res, next) => {
    try {
        // 🔹 Find all courses that are published (`isPublished: true`)
        const courses = await Course.find({ isPublished: true })
            // 🔹 Exclude `courseContent` and `enrolledStudents` fields from the result
            .select(['-courseContent', '-enrolledStudents']) 
            // 🔹 Populate `educator` field with full user details instead of just id
            .populate({ path: 'educator' });
  
        // 🔹 Send the retrieved courses as a JSON response
        res.status(200).json({ success: true, courses });
  
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
            course: courseData
        });
  
    } catch (error) {
        // 🔹 Handle errors properly
        return next(new HttpError(`Could not retrieve course: ${error.message}`, 500));
    }
  };