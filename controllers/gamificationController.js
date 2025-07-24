const { GamificationProfile } = require("../models/GamificationProfile");

exports.getGamification = async (req, res) => {
    try {
        const { id } = req.user;
        const gamificationProfile = await GamificationProfile.findOne({ user_id: id })
            .populate({
                path: "achievements.achievement", // Lấy thông tin chi tiết của achievement
                model: "Achievement", // Từ model Achievement
            })
            .lean();
        res.status(200).json({ ok: true, gamificationProfile });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

exports.getTopUsers = async (req, res) => {
    try {
        const { skip = 0, limit = 10, user_id } = req.query;

        // Lấy top users
        const topUsers = await GamificationProfile.find()
            .sort({ xp: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .select("level xp dailyStreak user_id")
            .populate("user_id", "_id displayName profilePicture")
            .lean();

        const totalUsers = await GamificationProfile.countDocuments({});
        let currentUser = null;
        let currentUserRank = null;

        // Kiểm tra nếu có user_id được truyền vào
        if (user_id != undefined && user_id !== "undefined") {
            currentUser = await GamificationProfile.findOne({ user_id }).select("level xp dailyStreak user_id").populate("user_id", "_id displayName profilePicture").lean();
            if (currentUser) {
                // Đếm tất cả users có stats tốt hơn hoặc bằng nhưng tạo trước
                const betterUsers = await GamificationProfile.countDocuments({
                    $or: [
                        { xp: { $gt: currentUser.xp } },
                        {
                            xp: currentUser.xp,
                            _id: { $lt: currentUser._id },
                        },
                    ],
                });

                currentUserRank = betterUsers + 1;
            }
        }

        res.status(200).json({
            ok: true,
            topUsers,
            hasMore: skip + limit <= totalUsers, // Kiểm tra còn tin nhắn chưa load
            currentUser: currentUser
                ? {
                      ...currentUser,
                      rank: currentUserRank,
                  }
                : null,
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};
