const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    user_report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //người gửi báo cáo
    },
    link: {
        type: String, //link bài viết bị báo cáo
        required: true,
    },
    type_of_violation: {
        type: String, // loại vi phạm spam, không phù hợp, khác
        enum: ["spam", "inappropriate", "other", "copyright", "misinformation"],
    },
    content: {
        type: String, //nội dung báo cáo
        trim: true,
    },
    status: {
        type: String, //trạng thái báo cáo đang chờ xử lí hoặc đã xử lí
        enum: ["pending", "resolved", "rejected"],
        default: "pending",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    resolved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //người giải quyết báo cáo (admin hoặc mod)
    },
    resolved_date: {
        type: Date, // ngày giải quyết báo cáo
    },
    resolved_content: {
        type: String, // nội dung giải quyết báo cáo
        trim: true,
    },
    is_violated: {
        type: Boolean, // đánh dấu báo cáo có hợp lệ hay không
        default: false,
    },
});

module.exports = mongoose.model("Report", ReportSchema);
