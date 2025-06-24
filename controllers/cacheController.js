const Cache = require("../models/Cache");

// Get all cache entries
const getAllCache = async (req, res) => {
    try {
        const caches = await Cache.find({}).sort({ _id: -1 }); // Sort by newest first

        res.status(200).json({
            success: true,
            count: caches.length,
            data: caches,
        });
    } catch (error) {
        console.error("Error getting all cache:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách cache",
            error: error.message,
        });
    }
};

// Get cache by key
const getCacheByKey = async (req, res) => {
    try {
        const { key } = req.params;

        const cache = await Cache.findOne({ key });

        if (!cache) {
            return res.status(404).json({
                success: false,
                message: "Cache không tồn tại",
            });
        }

        res.status(200).json({
            success: true,
            data: cache,
        });
    } catch (error) {
        console.error("Error getting cache by key:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy cache",
            error: error.message,
        });
    }
};

// Delete cache by key
const deleteCacheByKey = async (req, res) => {
    try {
        const { key } = req.params;

        const deletedCache = await Cache.findOneAndDelete({ key });

        if (!deletedCache) {
            return res.status(404).json({
                success: false,
                message: "Cache không tồn tại",
            });
        }

        res.status(200).json({
            success: true,
            message: "Xóa cache thành công",
            data: deletedCache,
        });
    } catch (error) {
        console.error("Error deleting cache:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa cache",
            error: error.message,
        });
    }
};

// Delete cache by ID
const deleteCacheById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCache = await Cache.findByIdAndDelete(id);

        if (!deletedCache) {
            return res.status(404).json({
                success: false,
                message: "Cache không tồn tại",
            });
        }

        res.status(200).json({
            success: true,
            message: "Xóa cache thành công",
            data: deletedCache,
        });
    } catch (error) {
        console.error("Error deleting cache by ID:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa cache",
            error: error.message,
        });
    }
};

// Delete all cache
const deleteAllCache = async (req, res) => {
    try {
        const result = await Cache.deleteMany({});

        res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} cache entries`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Error deleting all cache:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa tất cả cache",
            error: error.message,
        });
    }
};

// Delete expired cache manually
const deleteExpiredCache = async (req, res) => {
    try {
        const now = new Date();
        const result = await Cache.deleteMany({
            expireAt: { $lte: now },
        });

        res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} cache entries đã hết hạn`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Error deleting expired cache:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa cache hết hạn",
            error: error.message,
        });
    }
};

// Create or update cache
const setCache = async (req, res) => {
    try {
        const { key, data, expireAt } = req.body;

        if (!key || !data) {
            return res.status(400).json({
                success: false,
                message: "Key và data là bắt buộc",
            });
        }

        const cacheData = {
            key,
            data,
            expireAt: expireAt ? new Date(expireAt) : null,
        };

        const cache = await Cache.findOneAndUpdate({ key }, cacheData, { upsert: true, new: true });

        res.status(200).json({
            success: true,
            message: "Cache đã được lưu",
            data: cache,
        });
    } catch (error) {
        console.error("Error setting cache:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lưu cache",
            error: error.message,
        });
    }
};

module.exports = {
    getAllCache,
    getCacheByKey,
    deleteCacheByKey,
    deleteCacheById,
    deleteAllCache,
    deleteExpiredCache,
    setCache,
};
