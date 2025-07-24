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
        enum: ["user", "admin", "superadmin"],
    },
    status: {
        type: Boolean,
        default: true,
    },
    provider: {
        type: String,
        default: "local",
    },
    gamification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GamificationProfile",
    },
    profilePicture: {
        type: String,
        default: "https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg",
    },
    isChangePassword: {
        type: Boolean,
        default: false, // Chưa đổi mật khẩu
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

// Có thể thao tác với tất cả users và admins
// - Xem danh sách tất cả users/admins
// - Tạo/sửa/xóa/khóa tài khoản users và admins
// - Thay đổi role của users (user ↔ admin)
// - Reset password cho bất kỳ ai
// - Xem thống kê chi tiết về users
// // Toàn quyền với hệ thống
// - Quản lý cấu hình hệ thống
// - Backup/restore database
// - Xem logs hệ thống
// - Quản lý cache (/api/cache)
// - Cấu hình email, notification
// - Quản lý file uploads

// // Toàn quyền với content
// - CRUD tất cả quiz, flashcard
// - Quản lý reports
// - Moderator chat community
// - Quản lý notices/announcements
// - Xóa/chỉnh sửa bất kỳ nội dung nào

const PERMISSIONS = {
    superadmin: {
        users: ["create", "read", "update", "delete", "change_role"],
        admins: ["create", "read", "update", "delete", "change_role"],
        quiz: ["create", "read", "update", "delete", "moderate"],
        flashcard: ["create", "read", "update", "delete", "moderate"],
        system: ["config", "backup", "logs", "cache"],
        reports: ["read", "resolve", "delete"],
        chat: ["moderate", "delete", "ban"],
        notices: ["create", "update", "delete"],
    },
    admin: {
        users: ["read", "update", "delete"], // Không thể change_role
        quiz: ["create", "read", "update", "delete", "moderate"],
        flashcard: ["create", "read", "update", "delete", "moderate"],
        reports: ["read", "resolve"],
        chat: ["moderate"],
        notices: ["create", "update"],
    },
    user: {
        quiz: ["create", "read", "update_own", "delete_own"],
        flashcard: ["create", "read", "update_own", "delete_own"],
        profile: ["read", "update_own"],
        reports: ["create"],
    },
};
