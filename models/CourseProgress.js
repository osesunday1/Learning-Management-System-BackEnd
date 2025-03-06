import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lectureCompleted: [{ type: mongoose.Schema.Types.ObjectId }], // Track completed lectures
    progressPercentage: { type: Number, default: 0 } // Automatically updated
}, { minimize: false, timestamps: true });

// 🔹 Pre-Save Hook to Auto-Calculate Progress
courseProgressSchema.pre('save', async function (next) {
    const Course = mongoose.model("Course");
    const course = await Course.findById(this.courseId);
    
    if (course) {
        const totalLectures = course.courseContent.reduce((acc, chapter) => acc + chapter.chapterContent.length, 0);
        this.progressPercentage = totalLectures ? (this.lectureCompleted.length / totalLectures) * 100 : 0;
    }

    next();
});

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);