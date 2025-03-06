import multer from "multer";

// ✅ Use memory storage (no local file storage)
const storage = multer.memoryStorage();

// ✅ File type validation
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

// ✅ File size limit (5MB)
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter,
});

export default upload;