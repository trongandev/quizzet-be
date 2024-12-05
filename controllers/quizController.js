const { default: slugify } = require("slugify");
const { DataQuizModel, QuizModel } = require("../models/Quiz");
const generateRandomSlug = require("../services/random-slug");

const getQuiz = async (req, res) => {
    try {
        const quiz = await QuizModel.find({ status: true }).populate("uid", "profilePicture displayName verify").sort({ date: -1 });
        res.status(200).json({ quiz });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getQuizByUser = async (req, res) => {
    try {
        const { _id } = req.user;
        const quiz = await QuizModel.find({ uid: _id }).sort({ date: -1 });
        res.status(200).json({ quiz });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getQuizBySubject = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await QuizModel.find({ subject: id, status: true }).populate("uid", "displayName profilePicture verify").sort({ date: -1 });
        console.log(quiz);
        if (!quiz) {
            return res.status(404).json({ message: "Không tìm thấy Quiz", ok: false });
        }
        res.status(200).json({ quiz });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getQuizAdmin = async (req, res) => {
    try {
        const quiz = await QuizModel.find().sort({ date: -1 });
        res.status(200).json({ quiz, ok: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getQuizById = async (req, res) => {
    try {
        const { slug } = req.params;
        const quiz = await QuizModel.findOne({ slug: slug }).populate("uid", "displayName").populate("questions");
        res.status(200).json({ quiz });
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: "Không tìm thấy Quiz", status: 404 });
    }
};
const createQuiz = async (req, res) => {
    try {
        const { title, subject, email, content, img, noa, status, questions } = req.body;
        const { id } = req.user;
        // Validate required fields
        if (!title) return res.status(400).json({ message: "Vui lòng nhập tiêu đề" });
        if (!content) return res.status(400).json({ message: "Vui lòng nhập nội dung" });
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Cần có ít nhất một câu hỏi" });
        }

        // Validate questions
        const invalidQuestionIndex = questions.findIndex((question, index) => {
            if (!question.question) {
                return res.status(400).json({ message: `Câu hỏi đang bị để trống ở câu ${index + 1}` });
            }
            if (!Array.isArray(question.answers) || question.answers.length === 0) {
                return res.status(400).json({ message: `Đáp án câu hỏi số ${index + 1} chưa có` });
            }
            if (typeof question.correct !== "number" || question.correct < 0 || question.correct >= question.answers.length) {
                return res.status(400).json({ message: `Đáp án câu ${index + 1} bạn chưa chọn hoặc không hợp lệ` });
            }
            return false;
        });
        if (invalidQuestionIndex !== -1) return; // Return early if invalid question exists

        // Map valid questions to DataQuizModel instances
        const newQuestions = new DataQuizModel({
            data_quiz: questions,
        });

        // Save all questions in the DataQuiz collection
        const savedQuestions = await newQuestions.save();

        // Create and save the new quiz
        const newQuiz = new QuizModel({
            uid: id,
            slug: slugify(title, { lower: true }) + "-" + generateRandomSlug(),
            title,
            subject,
            email,
            content,
            img,
            noa,
            date: new Date(), // Current date
            questions: savedQuestions._id,
            status,
        });

        const savedQuiz = await newQuiz.save();

        // Return successful response
        res.status(201).json({ message: "Tạo Quiz thành công", quiz: savedQuiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

//xoá bài quiz
const deleteQuiz = async (req, res) => {
    try {
        const { _id } = req.body;
        const quiz = await QuizModel.findOneAndDelete({ _id });
        if (!quiz) {
            return res.status(404).json({ message: "Không tìm thấy Quiz", status: 404 });
        }
        res.status(200).json({ message: "Xoá Quiz thành công" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const updateQuiz = async (req, res) => {
    try {
        const quizId = req.params._id; // Lấy id từ URL
        if (!quizId) {
            return res.status(400).json({ message: "Bạn chưa đăng nhập, vui lòng reload lại trang", status: 400 });
        }
        const updateFields = {}; // Tạo đối tượng rỗng để chứa các trường cần cập nhật

        // Kiểm tra từng trường trong req.body và chỉ thêm vào các trường không undefined
        if (req.body.title !== undefined) {
            updateFields.title = req.body.title;
            updateFields.slug = slugify(title, { lower: true }) + "-" + generateRandomSlug();
        }
        if (req.body.subject !== undefined) updateFields.subject = req.body.subject;
        if (req.body.content !== undefined) updateFields.content = req.body.content;
        if (req.body.img !== undefined) updateFields.img = req.body.img;
        if (req.body.noa !== undefined) {
            updateFields.noa = req.body.noa;
            updateFields.noa += 1;
        }
        if (req.body.questions !== undefined) {
            const newQuestions = new DataQuizModel({
                data_quiz: req.body.questions,
            });
            const savedQuestions = await newQuestions.save();
            updateFields.questions = savedQuestions._id;
        }
        if (req.body.default !== undefined) updateFields.default = req.body.default;

        if (req.body.status !== undefined) updateFields.status = req.body.status;
        // Tìm và cập nhật quiz
        const updatedQuiz = await QuizModel.findByIdAndUpdate(
            quizId,
            {
                $set: updateFields, // Chỉ cập nhật các trường được gửi trong request
            },
            { new: true } // Trả về quiz đã được cập nhật
        );

        if (!updatedQuiz) {
            return res.status(404).json({ message: "Không tìm thấy quiz để cập nhật", status: 404 });
        }

        res.status(200).json({ message: "Cập nhật Quiz thành công", updatedQuiz });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    getQuiz,
    getQuizByUser,
    getQuizAdmin,
    getQuizBySubject,
    getQuizById,
    createQuiz,
    deleteQuiz,
    updateQuiz,
};
