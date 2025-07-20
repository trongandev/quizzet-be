const mongoose = require("mongoose");
const { loadTasksIntoCache } = require("../utils/taskCache");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log(`MongoDB connected`);
        loadTasksIntoCache(); // Tải task vào cache
    } catch (error) {
        console.log("Mongoose connect error", error);
        process.exit(1);
    }
};

module.exports = connectDB;
