const GamificationProfile = require("../models/GamificationProfile");
const { LEVEL_THRESHOLDS, TASKS } = require("../config/gamificationConfig");

class GamificationService {
    /**
     * Hàm chính để cộng XP cho người dùng sau khi hoàn thành một hành động.
     * @param {string} userId - ID của người dùng
     * @param {string} taskType - Loại nhiệm vụ (ví dụ: 'REVIEW_CARD')
     */
    static async addXpForTask(userId, taskType) {
        const task = TASKS[taskType];
        if (!task) {
            throw new Error("Loại nhiệm vụ không hợp lệ");
        }

        const profile = await GamificationProfile.findOne({ user: userId });
        if (!profile) {
            // Có thể tạo profile ở đây nếu chưa có
            throw new Error("Không tìm thấy hồ sơ game hóa của người dùng");
        }

        // Kiểm tra cấp độ yêu cầu để mở khóa nhiệm vụ
        if (task.UNLOCK_LEVEL && profile.level < task.UNLOCK_LEVEL) {
            console.log(`Nhiệm vụ ${taskType} yêu cầu cấp ${task.UNLOCK_LEVEL}.`);
            return; // Không làm gì cả
        }

        // Kiểm tra và reset tiến độ hàng ngày
        this.resetDailyProgressIfNeeded(profile);

        // Kiểm tra giới hạn XP hàng ngày cho nhiệm vụ này
        const progressField = `${taskType.toLowerCase()}XP`;
        if (profile.dailyProgress[progressField] >= task.DAILY_CAP) {
            console.log(`Đã đạt giới hạn XP hàng ngày cho nhiệm vụ ${taskType}.`);
            return; // Đã đạt giới hạn, không cộng thêm
        }

        // Cộng XP
        profile.xp += task.XP;
        profile.dailyProgress[progressField] += task.XP;

        // Kiểm tra lên cấp
        this.checkLevelUp(profile);

        // Cập nhật chuỗi ngày học
        this.updateDailyStreak(profile);

        // Lưu lại thay đổi
        await profile.save();

        return profile;
    }

    /**
     * Kiểm tra xem người dùng có lên cấp không.
     * @param {object} profile - Document GamificationProfile
     */
    static checkLevelUp(profile) {
        const currentLevel = profile.level;
        const nextLevel = currentLevel + 1;

        if (nextLevel > 16) return; // Đã max cấp

        const xpNeeded = LEVEL_THRESHOLDS[nextLevel];

        if (profile.xp >= xpNeeded) {
            profile.level = nextLevel;
            // Có thể thêm logic thưởng khi lên cấp ở đây
            console.log(`Chúc mừng! Bạn đã lên cấp ${nextLevel}!`);
            // Tiếp tục kiểm tra nếu có thể lên nhiều cấp một lúc
            this.checkLevelUp(profile);
        }
    }

    /**
     * Cập nhật chuỗi ngày học (Daily Streak).
     * @param {object} profile - Document GamificationProfile
     */
    static updateDailyStreak(profile) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày

        const lastActivity = profile.dailyStreak.lastActivityDate;
        if (lastActivity) {
            lastActivity.setHours(0, 0, 0, 0);
            const diffTime = today - lastActivity;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Tiếp tục chuỗi
                profile.dailyStreak.current += 1;
            } else if (diffDays > 2) {
                // Phá vỡ chuỗi, bắt đầu lại khi quá 2 ngày
                profile.dailyStreak.current = 1;
            }
        } else {
            // Lần hoạt động đầu tiên
            profile.dailyStreak.current = 1;
        }

        profile.dailyStreak.lastActivityDate = today;
    }

    /**
     * Reset tiến độ hàng ngày nếu đã qua ngày mới.
     * @param {object} profile - Document GamificationProfile
     */
    static resetDailyProgressIfNeeded(profile) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!profile.dailyProgress || !profile.dailyProgress.date || profile.dailyProgress.date.getTime() !== today.getTime()) {
            profile.dailyProgress = {
                date: today,
                reviewCardXP: 0,
                addWordXP: 0,
                createQuizXP: 0,
                doQuizXP: 0,
                rateQuizXP: 0,
            };
        }
    }
}

module.exports = GamificationService;
