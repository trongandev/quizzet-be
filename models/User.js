const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Cho phép null hoặc giá trị duy nhất
    },
    displayName: {
        type: String,
        required: true,
        min: 3,
        max: 20,
    },
    email: {
        type: String,
        required: true,
        max: 50,
        unique: true,
        sparse: true, // Cho phép null hoặc giá trị duy nhất
    },
    password: {
        type: String,
        min: 6,
    },
    verify: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        default: "user",
    },
    status: {
        type: Boolean,
        default: true,
    },
    provider: {
        type: String,
        default: "local",
    },
    profilePicture: {
        type: String,
        default: "https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    otp: {
        type: Number,
    },
    expire_otp: {
        type: Date,
    },
});

module.exports = mongoose.model("User", UserSchema);
