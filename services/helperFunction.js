const ActivityModel = require("../models/Activity");

/**
 * Tạo activity log cho các hành động của user
 * @param {String} userId - ID của user thực hiện hành động
 * @param {String} action - Loại hành động ('create', 'update', 'delete', 'view', 'complete')
 * @param {String} targetType - Loại đối tượng ('quiz', 'flashcard', 'listFlashCard', 'report', 'user', 'subOutline')
 * @param {String} targetId - ID của đối tượng được thao tác
 * @returns {Promise<Object>} - Activity document đã được tạo
 */
const handleCreateActivity = async (userId, action, targetType, targetId) => {
    try {
        const activity = new ActivityModel({
            userId,
            action,
            targetType,
            targetId,
        });

        await activity.save();
        return activity;
    } catch (error) {
        console.error("Error creating activity:", error);
        throw error;
    }
};

/**
 * Lấy danh sách activities của user với pagination
 * @param {String} userId - ID của user
 * @param {Number} page - Trang hiện tại (default: 1)
 * @param {Number} limit - Số lượng activities mỗi trang (default: 20)
 * @returns {Promise<Object>} - Danh sách activities và thông tin pagination
 */
const getUserActivities = async (userId, page = 1, limit = 20) => {
    try {
        const skip = (page - 1) * limit;

        const activities = await ActivityModel.find({ userId }).sort({ timestamp: -1 }).skip(skip).limit(limit).populate("targetId").lean();

        const total = await ActivityModel.countDocuments({ userId });
        const totalPages = Math.ceil(total / limit);

        return {
            activities,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    } catch (error) {
        console.error("Error getting user activities:", error);
        throw error;
    }
};
// lấy activities hôm nay
const getTodayUserActivities = async (userId) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const activities = await ActivityModel.find({
            userId,
            timestamp: { $gte: startOfDay },
        })
            .sort({ timestamp: -1 })
            .populate("targetId")
            .lean();

        return activities;
    } catch (error) {
        console.error("Error getting today's activities:", error);
        throw error;
    }
};

// lấy activities của tất cả user trong hôm nay
const getTodayActivities = async () => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const activities = await ActivityModel.find({
            timestamp: { $gte: startOfDay },
        })
            .sort({ timestamp: -1 })
            .populate("userId", "displayName profilePicture")
            .populate("targetId")
            .lean();

        return activities;
    } catch (error) {
        console.error("Error getting today's activities for all users:", error);
        throw error;
    }
};

/**
 * Lấy activities theo loại hành động
 * @param {String} userId - ID của user
 * @param {String} action - Loại hành động cần lọc
 * @param {Number} days - Số ngày gần đây (default: 30)
 * @returns {Promise<Array>} - Danh sách activities
 */
const getActivitiesByAction = async (userId, days = 30) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const activities = await ActivityModel.find({
            userId,
            timestamp: { $gte: startDate },
        })
            .sort({ timestamp: -1 })
            .populate("targetId")
            .lean();

        return activities;
    } catch (error) {
        console.error("Error getting activities by action:", error);
        throw error;
    }
};

/**
 * Lấy thống kê activities của user
 * @param {String} userId - ID của user
 * @param {Number} days - Số ngày gần đây (default: 30)
 * @returns {Promise<Object>} - Thống kê activities
 */
const getActivityStatistics = async (userId, days = 30) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stats = await ActivityModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    timestamp: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        action: "$action",
                        targetType: "$targetType",
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: "$_id.action",
                    targets: {
                        $push: {
                            type: "$_id.targetType",
                            count: "$count",
                        },
                    },
                    total: { $sum: "$count" },
                },
            },
        ]);

        return stats;
    } catch (error) {
        console.error("Error getting activity statistics:", error);
        throw error;
    }
};

/**
 * Xóa activities cũ (cleanup)
 * @param {Number} days - Xóa activities cũ hơn X ngày (default: 90)
 * @returns {Promise<Number>} - Số lượng activities đã xóa
 */
const cleanupOldActivities = async (days = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await ActivityModel.deleteMany({
            timestamp: { $lt: cutoffDate },
        });

        return result.deletedCount;
    } catch (error) {
        console.error("Error cleaning up old activities:", error);
        throw error;
    }
};

module.exports = {
    handleCreateActivity,
    getUserActivities,
    getTodayActivities,
    getTodayUserActivities,
    getActivitiesByAction,
    getActivityStatistics,
    cleanupOldActivities,
};
