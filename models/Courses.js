import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    lectureId: { type: String, required: true },
    lectureTitle: { type: String, required: true },
    lectureDuration: { type: Number, required: false }, // Not required for documents
    lectureUrl: { type: String, required: false }, // ✅ Video URL (optional)
    lectureFile: { 
        url: { type: String, required: false }, // ✅ Document URL (optional)
        filename: { type: String, required: false } // ✅ Document name
    },
    isPreviewFree: { type: Boolean, required: true },
    lectureOrder: { type: Number, required: true }
}, { _id: false });


const chapterSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Use ObjectId instead of chapterId
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number, required: true },
    chapterTitle: { type: String, required: true },
    chapterContent: [lectureSchema]
}, { _id: false });


const courseSchema = new mongoose.Schema({
    courseTitle: { type: String, required: true },
    courseDescription: { type: String, required: true },
    courseThumbnail: { type: String },
    coursePrice: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
    discount: { type: Number, min: 0 },
    courseContent: [chapterSchema],
    courseMaterials: [ // ✅ General course documents (e.g., syllabus, PDFs)
        {
            url: { type: String, required: false }, // Cloudinary URL
            filename: { type: String, required: false } // Original file name
        }
    ],
    courseRatings: [
        { 
            userId: { type: String }, 
            rating: { type: Number, min: 1, max: 5 } 
        }
    ],
    educator: { type: String, ref: 'User', required: true },
    enrolledStudents: [
        { type: String, ref: 'User' }
    ],
}, {timestamps: true, minimize: false});

// 🔹 Pre-Save Hook to Prevent Negative Course Prices
courseSchema.pre('save', function (next) {
    if (this.discount > this.coursePrice) {
        this.discount = this.coursePrice; // Ensure discount never exceeds course price
    }
    next();
});

// Create Model
const Course = mongoose.model('Course', courseSchema);

export default Course;

