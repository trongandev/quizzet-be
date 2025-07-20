const { GamificationProfile, Level } = require("../models/GamificationProfile");
const { getTaskDefinitions } = require("../utils/taskCache");

class GamificationService {
    /**
     * Hàm chính để cộng XP cho người dùng sau khi hoàn thành một hành động.
     * @param {string} userId - ID của người dùng
     * @param {string} taskType - Loại nhiệm vụ (ví dụ: 'REVIEW_CARD')
     */
    static async addXpForTask(userId, taskType) {
        // 1. Lấy thông tin cấu hình của nhiệm vụ
        const allTasks = getTaskDefinitions();
        const taskConfig = allTasks[taskType];
        if (!taskConfig) {
            throw new Error(`Loại nhiệm vụ không hợp lệ: ${taskType}`);
        }

        const profile = await GamificationProfile.findOne({ user_id: userId });
        if (!profile) {
            throw new Error("Không tìm thấy hồ sơ game hóa của người dùng");
        }

        // 2. Kiểm tra cấp độ yêu cầu
        if (profile.level < taskConfig.unlockLevel) {
            console.log(`Nhiệm vụ ${taskType} yêu cầu cấp ${taskConfig.unlockLevel}.`);
            return;
        }

        // 3. Kiểm tra và reset tiến độ hàng ngày (hàm đã sửa ở trên)
        this.resetDailyProgressIfNeeded(profile);

        // 4. Tìm hoặc tạo tiến trình cho nhiệm vụ trong ngày
        let taskProgress = profile.dailyProgress.tasks.find((t) => t.taskId === taskType);
        if (!taskProgress) {
            // Nếu chưa có, tạo mới và thêm vào mảng
            taskProgress = { taskId: taskType, count: 0 };
            profile.dailyProgress.tasks.push(taskProgress);
        }

        // 5. Kiểm tra giới hạn SỐ LẦN thực hiện
        if (taskProgress.count >= taskConfig.dailyLimitCount) {
            console.log(`Đã đạt giới hạn hàng ngày cho nhiệm vụ ${taskType}.`);
            return;
        }

        // 6. Cập nhật tiến trình và XP
        taskProgress.count += 1; // Tăng số lần thực hiện
        profile.xp += taskConfig.xpPerAction; // Cộng XP

        // 7. Kiểm tra lên cấp và chuỗi ngày học (giữ nguyên)
        await this.checkLevelUp(profile);
        this.updateDailyStreak(profile);

        // 8. Lưu lại thay đổi
        await profile.save();

        return profile;
    }

    /**
     * Kiểm tra xem người dùng có lên cấp không.
     * @param {object} profile - Document GamificationProfile
     */
    static async checkLevelUp(profile) {
        const currentLevel = profile.level;
        const nextLevel = currentLevel + 1;

        // Tìm thông tin của cấp độ TIẾP THEO trong database
        const nextLevelDoc = await Level.findOne({ level: nextLevel }).lean();

        // Nếu không tìm thấy, nghĩa là người dùng đã ở cấp tối đa
        if (!nextLevelDoc) {
            return;
        }

        // Lấy XP yêu cầu từ document vừa tìm được
        const xpNeeded = nextLevelDoc.xpRequired;

        if (profile.xp >= xpNeeded) {
            profile.level = nextLevel;
            console.log(`Chúc mừng! Bạn đã lên cấp ${nextLevel} - ${nextLevelDoc.name}!`);

            // Đệ quy để kiểm tra nếu có thể lên nhiều cấp
            // Phải có await vì hàm này giờ là async
            await this.checkLevelUp(profile);
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

        // Nếu chưa có dailyProgress hoặc đã qua ngày mới
        if (!profile.dailyProgress || !profile.dailyProgress.date || profile.dailyProgress.date.getTime() !== today.getTime()) {
            // Khởi tạo lại với cấu trúc MẢNG rỗng
            profile.dailyProgress = {
                date: today,
                tasks: [],
            };
        }
    }
}

module.exports = GamificationService;
