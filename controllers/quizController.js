const { default: slugify } = require("slugify");
const { DataQuizModel, QuizModel } = require("../models/Quiz");
const generateRandomSlug = require("../services/random-slug");
const Notification = require("../models/Notification");

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
        const { id } = req.user;
        const quiz = await QuizModel.find({ uid: id }).populate("uid", "_id displayName profilePicture").sort({ date: -1 });

        res.status(200).json({ ok: true, quiz });
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
        const quiz = await QuizModel.find().populate("uid", "_id displayName profilePicture created_at").sort({ date: -1 }).lean().exec();
        res.status(200).json({ quiz, ok: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getQuizById = async (req, res) => {
    try {
        const { slug } = req.params;
        const quiz = await QuizModel.findOne({ slug: slug }).populate([
            {
                path: "uid",
                select: "displayName profilePicture",
            },
            {
                path: "comment.user_id",
                select: "displayName profilePicture",
                sort: { created_at: -1 },
            },
            {
                path: "questions",
            },
        ]);
        res.status(200).json({ quiz });
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: "Không tìm thấy Quiz", status: 404 });
    }
};
const CreateComment = async (req, res) => {
    try {
        const { rating, review, quiz_id } = req.body;
        const { id } = req.user; // ID của người dùng từ token

        if (!rating) {
            return res.status(400).json({ message: "Vui lòng chọn sao" });
        }

        const quiz = await QuizModel.findById(quiz_id);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz không tồn tại" });
        }

        // Kiểm tra xem user đã bình luận chưa
        const existingCommentIndex = quiz.comment.findIndex((cmt) => cmt.user_id.toString() === id);

        if (existingCommentIndex !== -1) {
            // Nếu đã tồn tại, cập nhật bình luận
            quiz.comment[existingCommentIndex].rating = rating;
            quiz.comment[existingCommentIndex].review = review;
            quiz.comment[existingCommentIndex].created_at = Date.now(); // Cập nhật thời gian
            await quiz.save();
            res.status(201).json({ ok: true, exist: true, id: quiz.comment[existingCommentIndex]._id, message: "Cập nhật bình luận thành công" });
        } else {
            // Nếu chưa tồn tại, thêm bình luận mới
            const newComment = {
                user_id: id,
                rating,
                review,
            };
            quiz.comment.push(newComment);
            await quiz.save();
            // Nếu người dùng không phải là tác giả của quiz, tạo thông báo
            if (quiz.uid.toString() !== id.toString()) {
                const newNotification = new Notification({
                    recipient: quiz.uid,
                    sender: id,
                    type: "comment",
                    link: `/quiz/detail/${quiz?.slug}#${id}`,
                    content: "đã bình luận và đánh giá bài quiz của bạn.",
                });

                await newNotification.save();
            }

            res.status(201).json({ ok: true, message: "Bình luận thành công" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const createQuiz = async (req, res) => {
    try {
        const { title, subject, content, img, questions } = req.body;
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
            if (question.correct < 0 || question.correct >= question.answers.length) {
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
            content,
            img,
            questions: savedQuestions._id,
        });

        const savedQuiz = await newQuiz.save();

        const newNotification = new Notification({
            recipient: id,
            sender: id,
            type: "system",
            link: `/quiz/${savedQuiz.slug}`,
            content: "Tạo bài quiz thành công, bài của bạn đang được xem xét để được hiển thị lên trang chủ.",
        });

        await newNotification.save();

        // Return successful response
        res.status(201).json({ ok: true, message: "Tạo Quiz thành công", quiz: savedQuiz });
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
            updateFields.slug = slugify(req.body.title, { lower: true }) + "-" + generateRandomSlug();
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

const approveQuiz = async (req, res) => {
    try {
        const { status } = req.body;
        const { _id } = req.params;
        const { id } = req.user;
        const quiz = await QuizModel.findByIdAndUpdate(_id, { status }, { new: true });
        if (!quiz) {
            return res.status(404).json({ message: "Không tìm thấy Quiz", status: 404 });
        }
        if (status) {
            const newNotification = new Notification({
                recipient: quiz.uid,
                sender: id,
                type: "approve",
                link: `/quiz/${quiz.slug}`,
                content: "Bài quiz của bạn đã được xét duyệt và được hiển thị lên trang chủ.",
            });

            await newNotification.save();
            return res.status(200).json({ message: "Duyệt Quiz thành công" });
        } else {
            const newNotification = new Notification({
                recipient: quiz.uid,
                sender: id,
                type: "reject",
                link: `/quiz/${quiz.slug}`,
                content: "Bài quiz của bạn đã bị ẩn khỏi trang chủ do vi phạm quy định của chúng tôi.",
            });

            await newNotification.save();
            return res.status(200).json({ message: "Ẩn Quiz thành công" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const increaseHelpfulCount = async (req, res) => {
    try {
        const { quizId, commentId } = req.body;
        const { id } = req.user;

        // Tìm quiz và comment
        const quiz = await QuizModel.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Không tìm thấy Quiz" });
        }

        const comment = quiz.comment.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Không tìm thấy bình luận" });
        }

        // Kiểm tra nếu người dùng đã bầu chọn
        if (comment.helpful.includes(id)) {
            return res.status(400).json({ message: "Bạn đã bầu chọn cho bình luận này rồi" });
        }

        // Thêm người dùng vào danh sách đã bầu chọn
        comment.helpful.push(id);
        await quiz.save();

        res.status(200).json({ message: "Bầu chọn thành công", helpfulCount: comment.helpful.length });
    } catch (error) {
        console.error("Increase Helpful Count Error:", error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const DocumentBank = async (req, res) => {
    try {
        const { limit = 10, subject = "lsdang" } = req.query;

        // Convert limit to number and validate
        const questionLimit = parseInt(limit);
        if (isNaN(questionLimit) || questionLimit <= 0) {
            return res.status(400).json({
                message: "Số lượng câu hỏi không hợp lệ",
            });
        }

        // First, get all available quizzes for the subject
        const quizzes = await QuizModel.find({
            status: true,
            subject: subject,
        })
            .populate("questions")
            .sort({ date: -1 });

        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy câu hỏi cho môn học này",
            });
        }

        // Collect all questions from all quizzes
        let allQuestions = [];
        for (const quiz of quizzes) {
            if (quiz.questions && quiz.questions.data_quiz) {
                allQuestions = allQuestions.concat(quiz.questions.data_quiz);
            }
        }

        // Shuffle all questions
        const shuffledQuestions = shuffleArray(allQuestions);

        // Take only the requested number of questions
        const selectedQuestions = shuffledQuestions.slice(0, questionLimit);

        // If we don't have enough questions, inform the user
        if (selectedQuestions.length < questionLimit) {
            return res.status(200).json({
                message: `Chỉ tìm thấy ${selectedQuestions.length} câu hỏi trong ngân hàng đề`,
                questions: selectedQuestions,
                totalQuestions: selectedQuestions.length,
            });
        }

        // Return the selected questions
        res.status(200).json({
            questions: selectedQuestions,
            totalQuestions: selectedQuestions.length,
        });
    } catch (error) {
        console.error("DocumentBank Error:", error);
        res.status(500).json({
            message: "Server gặp lỗi, vui lòng thử lại sau ít phút",
        });
    }
};

module.exports = {
    getQuiz,
    getQuizByUser,
    getQuizAdmin,
    getQuizBySubject,
    getQuizById,
    CreateComment,
    createQuiz,
    deleteQuiz,
    updateQuiz,
    approveQuiz,
    DocumentBank,
};
