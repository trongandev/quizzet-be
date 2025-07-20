const { Level } = require("../models/GamificationProfile");

exports.getAllLevelDefinitions = async (req, res) => {
    try {
        const level = await Level.find().lean().sort({ level: 1 });
        res.status(200).json(level);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.getLevelDefinitionById = async (req, res) => {
    const { _id } = req.params;
    try {
        const achievement = await Level.findById(_id).lean();
        if (!achievement) {
            return res.status(404).json({ message: "Không tìm thấy thành tích" });
        }
        res.status(200).json(achievement);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.createLevelDefinition = async (req, res) => {
    const { level, name, xpRequired, levelIcon } = req.body;
    try {
        const newLevel = new Level({
            name,
            level,
            xpRequired,
            levelIcon,
        });
        await newLevel.save();
        res.status(201).json(newLevel);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tạo thành tích" });
    }
};

// create array achievement definition
exports.createLevelDefinitions = async (req, res) => {
    const level = req.body;
    try {
        const createdLevel = await Level.insertMany(level);
        res.status(201).json(createdLevel);
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Lỗi khi tạo thành tích" });
    }
};

exports.updateLevelDefinition = async (req, res) => {
    const { id } = req.params;
    const { level, name, xpRequired, levelIcon } = req.body;

    try {
        const updatedLevel = await Level.findByIdAndUpdate(
            id,
            {
                level,
                name,
                xpRequired,
                levelIcon,
            },
            { new: true }
        );
        if (!updatedLevel) {
            return res.status(404).json({ message: "Không tìm thấy thành tích để cập nhật" });
        }
        res.status(200).json(updatedLevel);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật thành tích" });
    }
};
