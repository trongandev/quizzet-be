// config/gamificationConfig.js

// Bảng cấp độ và XP đã thiết kế
const LEVEL_THRESHOLDS = {
    1: 0,
    2: 2000,
    3: 7000,
    4: 17000,
    5: 32000,
    6: 57000,
    7: 97000,
    8: 157000,
    9: 247000,
    10: 377000,
    11: 557000,
    12: 807000,
    13: 1157000,
    14: 1657000,
    15: 2357000,
    16: 3307000,
};

// Cấu hình XP và giới hạn cho các nhiệm vụ
// config/taskConfig.js
const TASKS = {
    REVIEW_CARD: {
        name: "Ôn tập thẻ",
        xpPerAction: 100,
        dailyLimitCount: 100, // Giới hạn theo SỐ LẦN
        unlockLevel: 1,
    },
    ADD_WORD: {
        name: "Thêm từ mới",
        xpPerAction: 100,
        dailyLimitCount: 50,
        unlockLevel: 1,
    },
    CREATE_QUIZ: {
        name: "Tạo bài quiz",
        xpPerAction: 1000,
        dailyLimitCount: 5,
        unlockLevel: 5,
    },
    DO_QUIZ: {
        name: "Làm bài quiz",
        xpPerAction: 500,
        dailyLimitCount: 10,
        unlockLevel: 8,
    },
    RATE_QUIZ: {
        name: "Đánh giá quiz",
        xpPerAction: 200,
        dailyLimitCount: 10,
        unlockLevel: 8,
    },
};

module.exports = {
    LEVEL_THRESHOLDS,
    TASKS,
};
