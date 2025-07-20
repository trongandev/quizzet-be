const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
    {
        // ID định danh duy nhất trong code, ví dụ: "REVIEW_CARD"
        taskId: {
            type: String,
            required: true,
            unique: true,
        },
        // Tên hiển thị cho người dùng
        name: {
            type: String,
            required: true,
        },
        // Mô tả ngắn về nhiệm vụ
        description: {
            type: String,
            default: "Hoàn thành nhiệm vụ này để nhận thưởng XP!",
        },
        //icon
        icon: {
            type: String,
        },
        // XP thưởng cho mỗi lần hoàn thành
        xpPerAction: {
            type: Number,
            required: true,
        },
        // Số lần làm tối đa mỗi ngày
        dailyLimitCount: {
            type: Number,
            required: true,
        },
        // Cấp độ yêu cầu để mở khóa
        unlockLevel: {
            type: Number,
            required: true,
            default: 1,
        },
        // Cờ để bật/tắt nhiệm vụ mà không cần xóa
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// TỐI ƯU: Thêm index cho trường isActive để truy vấn lấy tất cả các
// nhiệm vụ đang hoạt động nhanh hơn rất nhiều.
TaskSchema.index({ isActive: 1 });

const LevelSchema = new mongoose.Schema({
    // Số thứ tự của cấp độ, ví dụ: 1, 2, 3...
    level: {
        type: Number,
        required: true,
        unique: true,
    },
    // Tên của cấp độ, ví dụ: "Học viên tập sự"
    name: {
        type: String,
        required: true,
    },
    // Tổng XP tích lũy cần thiết để ĐẠT ĐƯỢC cấp độ này
    // Đây là trường quan trọng nhất để logic kiểm tra lên cấp
    xpRequired: {
        type: Number,
        required: true,
    },
    // (Tùy chọn) Đường dẫn tới icon/huy hiệu của cấp độ để hiển thị trên UI
    levelIcon: {
        type: String,
        required: true,
    },
});

const AchievementSchema = new mongoose.Schema({
    // Đây là ID định danh duy nhất, không thay đổi, dùng trong code
    // Ví dụ: "VOCAB_WARRIOR", "STREAK_7_DAYS"
    achievementId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        // Tên hiển thị ra cho người dùng
        type: String,
        required: true,
    },
    description: {
        // Mô tả điều kiện để đạt được
        type: String,
        required: true,
    },
    xpReward: {
        // Lượng XP thưởng khi đạt được
        type: Number,
        required: true,
        default: 0,
    },
    icon: {
        // Đường dẫn tới icon của thành tựu
        type: String,
        required: true,
    },
});

const UnlockedAchievementSchema = new mongoose.Schema(
    {
        // Lưu tham chiếu đến document trong collection 'Achievement'
        achievement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Achievement", // Rất quan trọng!
            required: true,
        },
        unlockedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

// Cấu trúc cho tiến trình của MỘT nhiệm vụ
const TaskProgressSchema = new mongoose.Schema(
    {
        // ID định danh duy nhất cho nhiệm vụ, ví dụ: "REVIEW_CARD", "ADD_WORD"
        // ID này sẽ liên kết với file cấu hình nhiệm vụ của bạn
        taskId: {
            type: String,
            required: true,
        },
        // Quan trọng: Lưu SỐ LẦN đã thực hiện, không phải XP
        count: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

// Cấu trúc chính cho toàn bộ tiến trình trong ngày
const DailyProgressSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        // Dùng một mảng để lưu tiến trình của tất cả các nhiệm vụ
        tasks: [TaskProgressSchema],
    },
    { _id: false }
);

const GamificationProfileSchema = new mongoose.Schema({
    // Liên kết một-một với User model
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    xp: {
        type: Number,
        default: 0,
        min: 0,
    },
    level: {
        type: Number,
        default: 1,
    },
    // Lưu trữ thông tin chuỗi ngày học
    dailyStreak: {
        current: { type: Number, default: 0 },
        // Ngày cuối cùng người dùng có hoạt động
        lastActivityDate: { type: Date },
    },
    // Theo dõi tiến độ nhiệm vụ trong ngày để giới hạn XP
    dailyProgress: DailyProgressSchema,
    // Lưu danh sách các huy hiệu đã đạt được
    achievements: [UnlockedAchievementSchema],
});

// Khi tạo một User mới, tự động tạo một GamificationProfile cho họ
// Bạn có thể đặt logic này trong controller đăng ký user
// UserSchema.post("save", async function(doc) { ... });

module.exports = {
    GamificationProfile: mongoose.model("GamificationProfile", GamificationProfileSchema),
    Achievement: mongoose.model("Achievement", AchievementSchema),
    Level: mongoose.model("Level", LevelSchema),
    Task: mongoose.model("Task", TaskSchema),
};
