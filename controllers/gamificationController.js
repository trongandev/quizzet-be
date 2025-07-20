const GamificationProfile = require("../models/GamificationProfile");

exports.getGamification = async (req, res) => {
    try {
        const { id } = req.user;
        const gamificationProfile = await GamificationProfile.findOne({ user_id: id })
            .populate({
                path: "achievements.achievement", // Lấy thông tin chi tiết của achievement
                model: "Achievement", // Từ model Achievement
            })
            .lean();
        res.status(200).json(gamificationProfile);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.updateTask = async (req, res) => {
    const { _id } = req.params;
    const { taskId, description, xpPerAction, dailyLimitCount, unlockLevel } = req.body;
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            _id,
            {
                taskId,
                description,
                xpPerAction,
                dailyLimitCount,
                unlockLevel,
            },
            { new: true }
        );
        if (!updatedTask) {
            return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
        }
        await loadTasksIntoCache();
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật nhiệm vụ" });
    }
};

exports.disableTask = async (req, res) => {
    const { id } = req.params;
    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
        }
        task.isActive = false;
        await task.save();
        await loadTasksIntoCache();
        res.status(200).json({ message: "Nhiệm vụ đã bị vô hiệu hóa" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi vô hiệu hóa nhiệm vụ" });
    }
};
