const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., 'create', 'update', 'delete'
    targetType: { type: String, required: true }, // e.g., 'quiz', 'flashcard', 'report'
    targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of the target document
    timestamp: { type: Date, default: Date.now },
});

ActivitySchema.index({ timestamp: -1 }); // Index for efficient querying by timestamp
const ActivityModel = mongoose.model("Activity", ActivitySchema);
module.exports = ActivityModel;
