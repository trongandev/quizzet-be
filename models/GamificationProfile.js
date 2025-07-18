const mongoose = require("mongoose");

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

const DailyProgressSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        reviewCardXP: { type: Number, default: 0 },
        addWordXP: { type: Number, default: 0 },
        createQuizXP: { type: Number, default: 0 },
        doQuizXP: { type: Number, default: 0 },
        rateQuizXP: { type: Number, default: 0 },
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
};

// [
//     {
//         "achievementId": "FIRST_10_CARDS_REVIEWED",
//         "name": "Học giả mới",
//         "description": "Hoàn thành ôn tập 10 thẻ đầu tiên.",
//         "xpReward": 1000,
//         "icon": "GraduationCap"
//     },
//     {
//         "achievementId": "ADD_20_NEW_CARDS",
//         "name": "Người sưu tầm từ vựng",
//         "description": "Thêm 20 thẻ mới vào bộ sưu tập.",
//         "xpReward": 2000,
//         "icon": "Book"
//     },
//     {
//         "achievementId": "REVIEW_100_TOTAL_CARDS",
//         "name": "Chiến binh từ vựng",
//         "description": "Ôn tập tổng cộng 100 thẻ.",
//         "xpReward": 5000,
//         "icon": "Swords"
//     },
//     {
//         "achievementId": "COLLECTION_500_CARDS",
//         "name": "Bộ sưu tập khủng",
//         "description": "Có 500 thẻ trong bộ sưu tập cá nhân.",
//         "xpReward": 25000,
//         "icon": "BriefcaseBusiness"
//     },
//     {
//         "achievementId": "MASTER_100_CARDS",
//         "name": "Người làm chủ ngôn ngữ",
//         "description": "Đạt efactor >= 2.7 cho 100 thẻ (thẻ đã thuộc).",
//         "xpReward": 50000,
//         "icon": "Crown"
//     },
//     {
//         "achievementId": "STREAK_3_DAYS",
//         "name": "Chuỗi 3 ngày",
//         "description": "Học liên tiếp 3 ngày.",
//         "xpReward": 3000,
//         "icon": "Flame"
//     },
//     {
//         "achievementId": "STREAK_7_DAYS",
//         "name": "Chuỗi 7 ngày",
//         "description": "Học liên tiếp 7 ngày.",
//         "xpReward": 7000,
//         "icon": "Flame"
//     },
//     {
//         "achievementId": "STREAK_30_DAYS",
//         "name": "Chuỗi 30 ngày",
//         "description": "Học liên tiếp 30 ngày.",
//         "xpReward": 30000,
//         "icon": "Flame"
//     },
//     {
//         "achievementId": "REVIEW_50_CARDS_IN_A_DAY",
//         "name": "Người học chăm chỉ",
//         "description": "Hoàn thành ôn tập 50 thẻ trong 1 ngày.",
//         "xpReward": 10000,
//         "icon": "BicepsFlexed"
//     },
//     {
//         "achievementId": "EARLY_BIRD_LEARNER",
//         "name": "Dậy sớm học bài",
//         "description": "Hoàn thành phiên ôn tập đầu tiên trước 7 giờ sáng.",
//         "xpReward": 5000,
//         "icon": "Sun"
//     },
//     {
//         "achievementId": "PERFECT_20_CARDS",
//         "name": "Hoàn hảo",
//         "description": "Đánh giá 20 thẻ là 'Hoàn hảo' (5/5).",
//         "xpReward": 5000,
//         "icon": "Star"
//     },
//     {
//         "achievementId": "ACCURACY_CHAMPION",
//         "name": "Nhà vô địch độ chính xác",
//         "description": "Đạt tỷ lệ đánh giá 5/5 trên 80% trong 50 thẻ gần nhất.",
//         "xpReward": 15000,
//         "icon": "Target"
//     },
//     {
//         "achievementId": "COMMUNITY_HELPER",
//         "name": "Người giúp đỡ cộng đồng",
//         "description": "Chia sẻ một bộ thẻ với 5 người khác.",
//         "xpReward": 20000,
//         "icon": "Handshake"
//     }
// ]
