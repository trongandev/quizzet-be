// utils/taskCache.js

const { Task } = require("../models/GamificationProfile");

let taskCache = {};

async function loadTasksIntoCache() {
    try {
        console.log("Đang tải cấu hình nhiệm vụ vào bộ đệm...");
        const activeTasks = await Task.find({ isActive: true }).lean();

        taskCache = activeTasks.reduce((acc, task) => {
            acc[task.taskId] = task;
            return acc;
        }, {});

        console.log(`Đã tải thành công ${Object.keys(taskCache).length} nhiệm vụ.`);
    } catch (error) {
        console.error("Lỗi khi tải cấu hình nhiệm vụ:", error);
    }
}

function getTaskDefinitions() {
    return taskCache;
}

module.exports = { loadTasksIntoCache, getTaskDefinitions };
