const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: "difw928hl",
    api_key: "913945986943786",
    api_secret: "pMYKdWkLDy_fiyzNsJa3WkE6XUo",
});
// Cấu hình Multer với Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "uploads", // Tên thư mục trong Cloudinary
        allowed_formats: ["jpg", "png", "jpeg", "webp"], // Định dạng cho phép
    },
});

const upload = multer({ storage: storage });
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.file;

        res.status(200).json({
            message: "File uploaded successfully",
            originalUrl: file.path,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

module.exports = { upload, uploadImage };
