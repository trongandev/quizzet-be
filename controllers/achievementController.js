const { Achievement } = require("../models/GamificationProfile");

// GET /api/achievements/definitions
exports.getAllAchievementDefinitions = async (req, res) => {
    try {
        const achievements = await Achievement.find().lean();
        res.status(200).json(achievements);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.getAchievementDefinitionById = async (req, res) => {
    const { _id } = req.params;
    try {
        const achievement = await Achievement.findById(_id).lean();
        if (!achievement) {
            return res.status(404).json({ message: "Không tìm thấy thành tích" });
        }
        res.status(200).json(achievement);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.createAchievementDefinition = async (req, res) => {
    const { name, description, icon, criteria } = req.body;
    try {
        const newAchievement = new Achievement({
            name,
            description,
            icon,
            criteria,
        });
        await newAchievement.save();
        res.status(201).json(newAchievement);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tạo thành tích" });
    }
};

// create array achievement definition
exports.createAchievementDefinitions = async (req, res) => {
    const achievements = req.body;
    try {
        const createdAchievements = await Achievement.insertMany(achievements);
        res.status(201).json(createdAchievements);
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Lỗi khi tạo thành tích" });
    }
};

exports.updateAchievementDefinition = async (req, res) => {
    const { id } = req.params;
    const { name, description, icon, criteria } = req.body;
    try {
        const updatedAchievement = await Achievement.findByIdAndUpdate(
            id,
            {
                name,
                description,
                icon,
                criteria,
            },
            { new: true }
        );
        if (!updatedAchievement) {
            return res.status(404).json({ message: "Không tìm thấy thành tích" });
        }
        res.status(200).json(updatedAchievement);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật thành tích" });
    }
};
