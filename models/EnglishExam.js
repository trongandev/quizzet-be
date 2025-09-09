// exam.model.js (Sử dụng Mongoose cho Node.js)

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// --- Sub-Schemas cho các thành phần câu hỏi ---
const OptionSchema = new Schema(
    {
        id: { type: String, required: true },
        text: { type: String, required: true },
    },
    { _id: false }
); // Không tạo _id mặc định cho sub-document này

const LeftItemSchema = new Schema(
    {
        id: { type: String, required: true },
        text: { type: String, required: true },
    },
    { _id: false }
);

const RightItemSchema = new Schema(
    {
        id: { type: String, required: true },
        text: { type: String, required: true },
    },
    { _id: false }
);

const CorrectMatchSchema = new Schema(
    {
        left_id: { type: String, required: true },
        right_id: { type: String, required: true },
    },
    { _id: false }
);

const ScrambledSentenceSchema = new Schema(
    {
        id: { type: String, required: true },
        text: { type: String, required: true },
    },
    { _id: false }
);

// --- Question Schema (Sub-document trong Exam) ---
// Đây là một schema linh hoạt với `discriminator` để xử lý các loại câu hỏi khác nhau
const BaseQuestionSchema = new Schema(
    {
        question_id: { type: String, required: true, unique: true }, // ID duy nhất cho mỗi câu hỏi
        question_type: {
            type: String,
            enum: ["multiple_choice", "fill_in_the_blank", "matching", "rearrange_sentences", "rewrite_sentence", "image_description", "listening_comprehension", "reading_comprehension"],
            required: true,
        },
        skill_focus: {
            type: String,
            enum: ["vocabulary", "grammar", "reading", "listening", "writing"],
            required: true,
        },
        question_text: { type: String },
        explanation: { type: String },
        score_points: { type: Number, required: true, default: 1 },
    },
    { discriminatorKey: "question_type", _id: false }
); // `discriminatorKey` giúp Mongoose phân biệt các loại câu hỏi

// --- Exam Schema Chính ---
const EnglishExamSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Liên kết với người tạo bài kiểm tra
    title: { type: String, required: true },
    description: { type: String },
    difficulty: {
        type: String,
        enum: ["a1", "a2", "b1", "b2", "c1", "c2"],
        required: true,
    },
    skills: [
        {
            type: String,
            enum: ["vocabulary", "grammar", "reading", "listening", "writing"],
        },
    ],
    timeLimit: { type: Number, default: 30 },
    total_score: { type: Number, default: 100 },
    questions: [BaseQuestionSchema], // Mảng các câu hỏi nhúng
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    is_published: { type: Boolean, default: false }, // Trạng thái bài kiểm tra (bản nháp/đã xuất bản)
    share_link: { type: String, unique: true, sparse: true }, // Link chia sẻ công khai (nếu có)
});

// Sử dụng discriminator để định nghĩa các thuộc tính riêng cho từng loại câu hỏi
EnglishExamSchema.path("questions").discriminator(
    "multiple_choice",
    new Schema(
        {
            options: [OptionSchema],
            correct_answer_id: { type: String },
        },
        { _id: false }
    )
);

EnglishExamSchema.path("questions").discriminator(
    "fill_in_the_blank",
    new Schema(
        {
            correct_answer_text: { type: String },
            blank_position: { type: [Number] }, // Array of numbers
        },
        { _id: false }
    )
);

EnglishExamSchema.path("questions").discriminator(
    "matching",
    new Schema(
        {
            left_items: [LeftItemSchema],
            right_items: [RightItemSchema],
            correct_matches: [CorrectMatchSchema],
        },
        { _id: false }
    )
);

EnglishExamSchema.path("questions").discriminator(
    "rearrange_sentences",
    new Schema(
        {
            scrambled_sentences: [ScrambledSentenceSchema],
            correct_order_ids: { type: [String] },
        },
        { _id: false }
    )
);

EnglishExamSchema.path("questions").discriminator(
    "rewrite_sentence",
    new Schema(
        {
            correct_answer_text: { type: String },
        },
        { _id: false }
    )
);

EnglishExamSchema.path("questions").discriminator(
    "image_description",
    new Schema(
        {
            image_url: { type: String },
            correct_answer_keywords: { type: [String] },
        },
        { _id: false }
    )
);

EnglishExamSchema.path("questions").discriminator(
    "listening_comprehension",
    new Schema(
        {
            audio_text: { type: String }, // Văn bản để chuyển đổi thành âm thanh
            options: [OptionSchema], // Tùy chọn: có thể là câu hỏi trắc nghiệm
            correct_answer_id: { type: String }, // Nếu là trắc nghiệm
            correct_answer_text: { type: String }, // Nếu là câu hỏi mở
        },
        { _id: false }
    )
);

EnglishExamSchema.path("questions").discriminator(
    "reading_comprehension",
    new Schema(
        {
            passage: { type: String },
            options: [OptionSchema],
            correct_answer_id: { type: String },
        },
        { _id: false }
    )
);

module.exports = mongoose.model("EnglishExam", EnglishExamSchema);
