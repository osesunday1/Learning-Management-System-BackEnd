import Course from '../models/Courses.js';
import { Purchase } from '../models/Purchase.js';
import UserModel from '../models/UserModel.js';
import HttpError from '../utils/httpError.js';
import {v2 as cloudinary} from 'cloudinary'



export const updateEducator = async(req, res, next)=>{
    
    try{
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm){
      return next(new HttpError('This route is not for password updates. Please use / update My Password.', 400));
    }

    //2)filtered out unwanted fields
    const filteredBody= filterObj(req.body, 'name', 'email');

    //3) update user document
    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data:{
        user: updatedUser
      }
    });
    

  }catch(err){
    return next(new HttpError(`Updating your details failed: ${err.message}`, 500));
  }
  };


  // Add New Course
export const addCourse = async(req, res, next) => {
  try{
    console.log("REQ FILE: ", req.file); // ✅ Debugging: Check if file exists
    console.log("REQ BODY: ", req.body); // ✅ Debugging: Check if form data exists


    const { courseData } = req.body
    const imageFile = req.file
    const educatorId = req.user.id

    if (!imageFile) {
        return res.json({ success: false, message: 'Image Not Attached' });
    }
    
    const parsedCourseData = await JSON.parse(courseData);
    parsedCourseData.educator = educatorId;
  
    const newCourse=await Course.create(parsedCourseData);
    const imageUpload= await cloudinary.uploader.upload(imageFile.path)
    newCourse.courseThumbnail = imageUpload.secure_url
    await newCourse.save()

    res.status(200).json({
      status: 'success',
      message:{
        Course: newCourse
      }
    });

  }catch(err){
    return next(new HttpError(`Creating Course failed: ${err.message}`, 500));
  }
}


// Get Educator Courses
export const getEducatorCourses = async (req, res, next) => {
  try {
      const educator = req.user.id
      const courses = await Course.find({ educator });
      res.json({ success: true, courses });
  } catch (err) {
    return next(new HttpError(`Could not get Educator Courses courses: ${err.message}`, 500));
  }
};


// Get Educator Data (total earnings, enrolled students, number of courses)
export const educatorDashboardData = async (req, res, next) => {
  try {
      // Get the educator's ID from the authenticated request
      const educator = req.user.id;

      // Fetch all courses created by the educator
      const courses = await Course.find({ educator });

      // Get the total number of courses created by the educator
      const totalCourses = courses.length;

      // Extract the course IDs for further queries
      const courseIds = courses.map(course => course._id);

      // Calculate total earnings from purchases
      const purchases = await Purchase.find({
        courseId: { $in: courseIds }, // Find all purchases related to the educator's courses
        status: 'completed' // Only include completed purchases
      });

      // Sum up the total earnings from the educator's courses
      const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

      // Get enrolled students for each course in parallel
      const enrolledStudentsData = await Promise.all(
          courses.map(async (course) => {
              const students = await User.find({ _id: { $in: course.enrolledStudents } }, 'name imageUrl');
              return students.map(student => ({
                  courseTitle: course.courseTitle,
                  student
              }));
          })
      );

      // Flatten the array of enrolled students
      const flattenedEnrolledStudents = enrolledStudentsData.flat();

      // Send the educator's dashboard data as a JSON response
      res.status(200).json({
          success: true,
          dashboardData: {
              totalEarnings, // Total earnings from completed purchases
              enrolledStudentsData: flattenedEnrolledStudents, // List of students with their enrolled courses
              totalCourses // Total number of courses created by the educator
          }
      });

  } catch (error) {
      // Handle errors and return a server error response
      return next(new HttpError(`Could not get Educator statistics data: ${error.message}`, 500));
  }
};


//======================= Get all students enrolled in a course
export const getCourseStudents = async (req, res, next) => {
  try {
      const { courseId } = req.params; // Get course ID from request parameters

      // Find the course and ensure it exists
      const course = await Course.findById(courseId);
      if (!course) {
          return next(new HttpError('Course not found', 404));
      }

      // Get student details from User model
      const students = await User.find(
          { _id: { $in: course.enrolledStudents } }, // Find users whose IDs are in enrolledStudents
          'name email imageUrl' // Select fields to return
      );

      res.status(200).json({
          success: true,
          courseTitle: course.courseTitle,
          students
      });

  } catch (err) {
      return next(new HttpError(`Could not retrieve students: ${err.message}`, 500));
  }
};