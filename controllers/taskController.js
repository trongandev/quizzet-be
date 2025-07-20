// controllers/taskController.js

const { Task } = require("../models/GamificationProfile");
const { getTaskDefinitions, loadTasksIntoCache } = require("../utils/taskCache");

exports.getTaskDefinitions = async (req, res) => {
    try {
        // Lấy task trực tiếp từ cache, không cần truy vấn DB
        const tasks = getTaskDefinitions();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.createTask = async (req, res) => {
    try {
        const { taskId, description, xpPerAction, dailyLimitCount, unlockLevel } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!taskId || !description || !xpPerAction || !dailyLimitCount || !unlockLevel) {
            return res.status(400).json({ message: "Thiếu thông tin nhiệm vụ" });
        }

        // Tạo nhiệm vụ mới
        const newTask = Task({
            taskId,
            description,
            xpPerAction,
            dailyLimitCount,
            unlockLevel,
        });
        await newTask.save();

        res.status(201).json({ message: "Nhiệm vụ đã được tạo" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.createManyTask = async (req, res) => {
    const tasks = req.body;
    try {
        const createdTask = await Task.insertMany(tasks);
        await loadTasksIntoCache();
        res.status(201).json(createdTask);
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Lỗi khi tạo thành tích" });
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
