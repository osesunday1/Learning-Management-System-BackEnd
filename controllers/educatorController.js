import Course from '../models/Courses.js';
import { Purchase } from '../models/Purchase.js';
import UserModel from '../models/UserModel.js';
import HttpError from '../utils/httpError.js';
import {v2 as cloudinary} from 'cloudinary'
import { bucket } from "../configs/firebaseConfig.js"; // ✅ Import Firebase Admin Config


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


  //============== Add New Course

  export const addCourse = async (req, res, next) => {
    try {
        const { courseData } = req.body;
        const educatorId = req.user.id;
        const files = req.files; // 🔹 Multer stores uploaded files here

        if (!files || !files.image) {
            return res.status(400).json({ success: false, message: "Image Not Attached" });
        }

        // 🔹 Upload Course Thumbnail to Cloudinary
        const base64Image = `data:${files.image[0].mimetype};base64,${files.image[0].buffer.toString("base64")}`;
        const imageUpload = await cloudinary.uploader.upload(base64Image, {
            folder: "courses",
            resource_type: "image",
        });

        // 🔹 Upload Course Materials (Syllabus, Notes) to Firebase Storage
        let uploadedDocuments = [];
        if (files.documents) {
            uploadedDocuments = await Promise.all(
                files.documents.map(async (doc) => {
                    const fileName = `course-materials/${Date.now()}_${doc.originalname}`;
                    const fileUpload = bucket.file(fileName);

                    await fileUpload.save(doc.buffer, {
                        metadata: { contentType: doc.mimetype },
                        public: true,
                    });

                    const fileUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
                    return { url: fileUrl, filename: doc.originalname };
                })
            );
        }

        // 🔹 Parse Course Data
        const parsedCourseData = JSON.parse(courseData);
        parsedCourseData.educator = educatorId;
        parsedCourseData.courseThumbnail = imageUpload.secure_url; // ✅ Store Cloudinary image URL
        parsedCourseData.courseMaterials = uploadedDocuments; // ✅ Store Firebase document URLs

        // 🔹 Process Lecture Documents (Upload to Firebase)
        if (parsedCourseData.courseContent) {
            for (let chapter of parsedCourseData.courseContent) {
                for (let lecture of chapter.chapterContent) {
                    if (files.lectureFiles && files.lectureFiles.length > 0) {
                        const lectureDoc = files.lectureFiles.shift(); // Get first file

                        // ✅ Upload to Firebase Storage
                        const fileName = `lecture-documents/${Date.now()}_${lectureDoc.originalname}`;
                        const fileUpload = bucket.file(fileName);

                        await fileUpload.save(lectureDoc.buffer, {
                            metadata: { contentType: lectureDoc.mimetype },
                            public: true,
                        });

                        // ✅ Store Firebase URL in Lecture Object
                        lecture.lectureFile = {
                            url: `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`,
                            filename: lectureDoc.originalname,
                        };
                    }
                }
            }
        }

        // 🔹 Create Course in Database
        const newCourse = await Course.create(parsedCourseData);

        res.status(201).json({ success: true, message: "Course added successfully!", course: newCourse });

    } catch (err) {
        return next(new HttpError(`Creating Course failed: ${err.message}`, 500));
    }
};



/////// Get Educator Courses
export const getEducatorCourses = async (req, res, next) => {
  try {
      const educator = req.user.id
      const data = await Course.find({ educator });
      res.json({ success: true, data });
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



// ✅ Update Course Controller
export const updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const educatorId = req.user.id; // ✅ Ensure only course creator can update it
    const { courseData } = req.body;
    const imageFile = req.file; // ✅ Optional: New image uploaded

    // ✅ Find course
    const course = await Course.findOne({ _id: courseId, educator: educatorId });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found or unauthorized" });
    }

    // ✅ If new image is uploaded, replace the old one
    if (imageFile) {
      // 🔹 Delete old image from Cloudinary
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split('/').pop().split('.')[0]; // Extract public_id
        await cloudinary.uploader.destroy(`courses/${publicId}`);
      }

      // 🔹 Upload new image
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        folder: "courses",
        resource_type: "image",
      });

      course.courseThumbnail = imageUpload.secure_url; // ✅ Save new image URL
    }

    // ✅ Ensure `courseData` exists before parsing
    if (!courseData) {
      return res.status(400).json({ success: false, message: "Course data is missing" });
    }

    // ✅ Update course fields
    const parsedCourseData = JSON.parse(courseData);
    Object.assign(course, parsedCourseData); // ✅ Merge new data

    await course.save();

    res.status(200).json({ success: true, message: "Course updated successfully!", course });

  } catch (err) {
    return next(new HttpError(`Updating Course failed: ${err.message}`, 500));
  }
};


// ✅ Delete Course Controller
export const deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const educatorId = req.user.id; // ✅ Ensure only course creator can delete it

    // ✅ Find course
    const course = await Course.findOne({ _id: courseId, educator: educatorId });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found or unauthorized" });
    }

    // ✅ If course has a thumbnail, delete it from Cloudinary
    if (course.courseThumbnail) {
      const publicId = course.courseThumbnail.split('/').pop().split('.')[0]; // Extract Cloudinary public ID
      await cloudinary.uploader.destroy(`courses/${publicId}`);
    }

    // ✅ Delete the course from MongoDB
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ success: true, message: "Course deleted successfully!" });

  } catch (err) {
    return next(new HttpError(`Deleting Course failed: ${err.message}`, 500));
  }
};
