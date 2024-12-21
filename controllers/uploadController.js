const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: "difw928hl",
    api_key: "913945986943786",
    api_secret: "pMYKdWkLDy_fiyzNsJa3WkE6XUo",
});
console.log("", process.env.CLOUD_NAME);
// Cấu hình Multer với Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "uploads", // Tên thư mục trong Cloudinary
        allowed_formats: ["jpg", "png", "jpeg", "webp"], // Định dạng cho phép
    },
});

const upload = multer({ storage: storage });

// Controller xử lý upload
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const file = req.file;
        res.status(200).json({
            message: "File uploaded successfully",
            data: file.path, // URL của ảnh trên Cloudinary
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

module.exports = { upload, uploadImage };
