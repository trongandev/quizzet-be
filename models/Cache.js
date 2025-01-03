const mongoose = require("mongoose");

const CacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    expireAt: { type: Date, default: null }, // Thời gian hết hạn
});

CacheSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }); // Tự động xóa khi hết hạn
const CacheModel = mongoose.model("Cache", CacheSchema);
module.exports = CacheModel;
