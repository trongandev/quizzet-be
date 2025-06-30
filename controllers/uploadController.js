const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const sharp = require("sharp");

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: "difw928hl",
    api_key: "913945986943786",
    api_secret: "pMYKdWkLDy_fiyzNsJa3WkE6XUo",
});
// Cấu hình Multer với Cloudinary Storage

const uploadImage = async (req, res) => {
    try {
        // Resize và nén ảnh bằng sharp
        const optimizedBuffer = await sharp(req.file.buffer)
            .resize({ width: 800 }) // chỉnh độ rộng tối đa
            .jpeg({ quality: 70 }) // nén ảnh xuống 70%
            .toBuffer();

        // Upload lên Cloudinary từ buffer
        // Upload lên Cloudinary từ buffer (không cần streamifier)
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: "uploads",
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                )
                .end(optimizedBuffer);
        });

        return res.json({ url: result.secure_url });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Upload failed" });
    }
};

module.exports = { uploadImage };
