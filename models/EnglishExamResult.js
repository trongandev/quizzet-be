// testResult.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EnglishAnswerSchema = new Schema(
    {
        question_id: { type: String, required: true },
        user_answer: { type: Schema.Types.Mixed }, // Lưu câu trả lời của người dùng (có thể là string, array, object tùy loại câu hỏi)
        is_correct: { type: Boolean }, // Cho câu hỏi tự động chấm điểm
        score_obtained: { type: Number }, // Điểm số thực nhận được
        feedback: { type: String }, // Phản hồi chi tiết từ AI (nếu có)
    },
    { _id: false }
);

const EnglishExamResultSchema = new Schema({
    exam_id: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    taker_name: { type: String, required: true, trim: true },

    // Trường tùy chọn: user_id nếu người làm bài đã đăng nhập
    // Sẽ là null nếu là khách
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    total_score_achieved: { type: Number, required: true },
    time_taken_minutes: { type: Number },
    answers: [EnglishAnswerSchema], // Mảng các câu trả lời của người dùng
    submitted_at: { type: Date, default: Date.now },
});

// Có thể thêm index để tối ưu truy vấn kết quả theo exam_id và user_id
EnglishExamResultSchema.index({ exam_id: 1, user_id: 1 });

module.exports = mongoose.model("EnglishExamResult", EnglishExamResultSchema);
