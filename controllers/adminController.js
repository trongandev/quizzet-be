const { SOModel } = require("../models/SO");
const { QuizModel } = require("../models/Quiz");
const { FlashCard, ListFlashCard } = require("../models/FlashCard");
const Report = require("../models/Report");
const User = require("../models/User");

const analysticAll = async (req, res) => {
    try {
        const subOutline = await SOModel.find();
        const quiz = await QuizModel.find();
        const flashcard = await FlashCard.find();
        const listFlashcard = await ListFlashCard.find();
        const report = await Report.find();
        const user = await User.find();
        // Tạo data cho biểu đồ người dùng đăng ký theo ngày
        const userRegistrationData = {};
        user.forEach((u) => {
            const month = new Date(u.created_at).getMonth(); // Lấy ngày đăng ký
            userRegistrationData[month] = (userRegistrationData[month] || 0) + 1;
        });

        const chartData = Object.entries(userRegistrationData)
            .map(([month, count]) => ({
                month,
                count,
            }))
            .sort((a, b) => new Date(a.month) - new Date(b.month));
        const data = {
            subOutline: subOutline.length,
            quiz: quiz.length,
            flashcard: flashcard.length,
            listFlashcard: listFlashcard.length,
            report: report.length,
            user: user.length,
            chartData,
        };
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    analysticAll,
};
