import multer from "multer";

// ✅ Use memory storage (no local file storage)
const storage = multer.memoryStorage();

// ✅ Allow Images, PDFs, DOCX, PPTX
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "application/pdf",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-powerpoint", // .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Unsupported file format! Allowed: images, PDFs, DOCX, PPTX"), false);
    }
    cb(null, true);
};

// ✅ File size limit (Max: 10MB)
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    fileFilter,
});

// ✅ Export as default
export default upload;