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
const TASKS = {
    REVIEW_CARD: { XP: 100, DAILY_CAP: 10000 },
    ADD_WORD: { XP: 100, DAILY_CAP: 5000 },
    CREATE_QUIZ: { XP: 1000, DAILY_CAP: 5000, UNLOCK_LEVEL: 5 },
    DO_QUIZ: { XP: 500, DAILY_CAP: 5000, UNLOCK_LEVEL: 8 },
    RATE_QUIZ: { XP: 200, DAILY_CAP: 2000, UNLOCK_LEVEL: 8 },
};

module.exports = {
    LEVEL_THRESHOLDS,
    TASKS,
};
