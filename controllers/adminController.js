const { SOModel } = require("../models/SO");
const { QuizModel } = require("../models/Quiz");
const { FlashCard, ListFlashCard } = require("../models/FlashCard");
const Report = require("../models/Report");
const User = require("../models/User");
const { getTodayActivities } = require("../services/helperFunction");

const analysticAll = async (req, res) => {
    try {
        // Lấy ngày hiện tại và tháng trước
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Query dữ liệu tháng hiện tại và tháng trước
        const currentMonthData = {
            subOutline: await SOModel.countDocuments({ created_at: { $gte: currentMonth, $lt: nextMonth } }),
            quiz: await QuizModel.countDocuments({ created_at: { $gte: currentMonth, $lt: nextMonth } }),
            flashcard: await FlashCard.countDocuments({ created_at: { $gte: currentMonth, $lt: nextMonth } }),
            listFlashCard: await ListFlashCard.countDocuments({ created_at: { $gte: currentMonth, $lt: nextMonth } }),
            report: await Report.countDocuments({ created_at: { $gte: currentMonth, $lt: nextMonth } }),
            user: await User.countDocuments({ created_at: { $gte: currentMonth, $lt: nextMonth } }),
        };

        const lastMonthData = {
            subOutline: await SOModel.countDocuments({ created_at: { $gte: lastMonth, $lt: currentMonth } }),
            quiz: await QuizModel.countDocuments({ created_at: { $gte: lastMonth, $lt: currentMonth } }),
            flashcard: await FlashCard.countDocuments({ created_at: { $gte: lastMonth, $lt: currentMonth } }),
            listFlashCard: await ListFlashCard.countDocuments({ created_at: { $gte: lastMonth, $lt: currentMonth } }),
            report: await Report.countDocuments({ created_at: { $gte: lastMonth, $lt: currentMonth } }),
            user: await User.countDocuments({ created_at: { $gte: lastMonth, $lt: currentMonth } }),
        };

        // Tính tỉ lệ % thay đổi so với tháng trước
        const calculatePercentageChange = (current, previous) => {
            if (previous === 0) {
                return current > 0 ? 100 : 0; // Nếu tháng trước = 0, tháng này > 0 thì tăng 100%
            }
            return Math.round(((current - previous) / previous) * 100);
        };

        const percentageChanges = {
            subOutline: calculatePercentageChange(currentMonthData.subOutline, lastMonthData.subOutline),
            quiz: calculatePercentageChange(currentMonthData.quiz, lastMonthData.quiz),
            flashcard: calculatePercentageChange(currentMonthData.flashcard, lastMonthData.flashcard),
            listFlashCard: calculatePercentageChange(currentMonthData.listFlashCard, lastMonthData.listFlashCard),
            report: calculatePercentageChange(currentMonthData.report, lastMonthData.report),
            user: calculatePercentageChange(currentMonthData.user, lastMonthData.user),
        };

        // Lấy tổng số dữ liệu (như code cũ)
        const totalData = {
            subOutline: await SOModel.countDocuments(),
            quiz: await QuizModel.countDocuments(),
            flashcard: await FlashCard.countDocuments(),
            listFlashCard: await ListFlashCard.countDocuments(),
            report: await Report.countDocuments(),
            user: await User.countDocuments(),
        };

        // Tạo data cho biểu đồ người dùng đăng ký theo tháng
        const user = await User.find().select("created_at");
        const userRegistrationData = {};
        user.forEach((u) => {
            const month = new Date(u.created_at).getMonth();
            userRegistrationData[month] = (userRegistrationData[month] || 0) + 1;
        });

        const chartData = Object.entries(userRegistrationData)
            .map(([month, count]) => ({
                month: parseInt(month),
                count,
            }))
            .sort((a, b) => a.month - b.month);
        // tạo biểu đồ pie chart về tất cả các ngôn ngữ của list-flashcard
        const flashCardLanguages = await ListFlashCard.aggregate([
            {
                $group: {
                    _id: "$language",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    language: "$_id",
                    count: 1,
                    _id: 0,
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);

        const activity = await getTodayActivities();
        const data = {
            total: totalData,
            percentageChanges,
            chartData: flashCardLanguages,
            activity,
        };

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    analysticAll,
};
