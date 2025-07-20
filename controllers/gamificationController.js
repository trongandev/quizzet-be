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
