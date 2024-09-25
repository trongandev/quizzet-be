const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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
    },
    password: {
        type: String,
        required: true,
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
