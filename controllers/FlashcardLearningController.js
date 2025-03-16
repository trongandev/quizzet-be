// controllers/learningController.js
const { FlashCard, ListFlashCard } = require("../models/FlashCard"); // Đảm bảo đường dẫn chính xác

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Hằng số cho thuật toán spaced repetition
const EASY_FACTOR = 2.5;
const GOOD_FACTOR = 1.5;
const HARD_FACTOR = 1.2;
const AGAIN_FACTOR = 1;

/**
 * Lấy danh sách flashcards cần ôn tập hôm nay
 */
exports.getDueCards = async (req, res) => {
    try {
        const { listId } = req.params;
        const userId = req.user.id;

        // Kiểm tra quyền sở hữu
        const list = await ListFlashCard.findOne({
            _id: listId,
            userId: userId,
        });

        if (!list) {
            return res.status(404).json({ message: "Không tìm thấy danh sách hoặc không có quyền truy cập" });
        }

        // Lấy tất cả thẻ trong danh sách
        const flashcards = await FlashCard.find({
            _id: { $in: list.flashcards },
            $or: [
                // Thẻ đến hạn ôn tập (nextReviewDate <= ngày hiện tại)
                { nextReviewDate: { $lte: new Date() } },
                // Thẻ mới chưa học (learnedTimes = 0)
                { "progress.learnedTimes": 0 },
            ],
        }).limit(20); // Giới hạn số lượng thẻ mỗi lần

        res.status(200).json({
            success: true,
            count: flashcards.length,
            data: flashcards,
        });
    } catch (error) {
        console.error("Lỗi khi lấy thẻ cần ôn tập:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message,
        });
    }
};

/**
 * Cập nhật kết quả học tập cho một flashcard
 */
exports.updateCardProgress = async (req, res) => {
    try {
        const { cardId } = req.params;
        const { result, difficulty } = req.body; // result: true/false, difficulty: "easy", "good", "hard", "again"

        // Tìm thẻ trong database
        const card = await FlashCard.findById(cardId);
        if (!card) {
            return res.status(404).json({ message: "Không tìm thấy flashcard" });
        }

        // Tính toán khoảng thời gian mới cho spaced repetition
        let intervalFactor;
        switch (difficulty) {
            case "easy":
                intervalFactor = EASY_FACTOR;
                break;
            case "good":
                intervalFactor = GOOD_FACTOR;
                break;
            case "hard":
                intervalFactor = HARD_FACTOR;
                break;
            case "again":
                intervalFactor = AGAIN_FACTOR;
                break;
            default:
                intervalFactor = result ? GOOD_FACTOR : AGAIN_FACTOR;
        }

        // Tính khoảng thời gian mới (tối thiểu 1 ngày)
        const newInterval = Math.max(1, Math.round(card.interval * intervalFactor || 1));

        // Tính ngày ôn tập tiếp theo
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        // Cập nhật lịch sử học tập
        card.history.push({
            date: new Date(),
            result: result,
        });

        // Cập nhật tiến trình
        card.progress.learnedTimes += 1;

        // Tính % thành thạo dựa trên lịch sử gần đây (10 lần gần nhất)
        const recentHistory = card.history.slice(-10);
        const successCount = recentHistory.filter((h) => h.result === true).length;
        const successRate = recentHistory.length > 0 ? (successCount / recentHistory.length) * 100 : 0;

        // Cập nhật trạng thái
        if (successRate >= 80 && recentHistory.length >= 3) {
            card.status = "remembered";
        } else if (successRate >= 50) {
            card.status = "learned";
        } else {
            card.status = "reviewing";
        }

        // Cập nhật các trường khác
        card.progress.percentage = Math.round(successRate);
        card.interval = newInterval;
        card.nextReviewDate = nextReviewDate;

        await card.save();

        // Cập nhật tiến trình của danh sách
        await updateListProgress(card);

        res.status(200).json({
            success: true,
            data: card,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật tiến trình:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message,
        });
    }
};

/**
 * Cập nhật tiến trình của danh sách flashcard
 */
const updateListProgress = async (card) => {
    // Tìm tất cả danh sách chứa card này
    const lists = await ListFlashCard.find({ flashcards: card._id });

    for (const list of lists) {
        // Lấy tất cả thẻ trong danh sách
        const cards = await FlashCard.find({ _id: { $in: list.flashcards } });

        // Tính số thẻ đã nhớ
        const rememberedCards = cards.filter((c) => c.status === "remembered").length;

        // Tính % tiến độ trung bình
        const totalPercentage = cards.reduce((sum, c) => sum + c.progress.percentage, 0);
        const averagePercentage = cards.length > 0 ? Math.round(totalPercentage / cards.length) : 0;

        // Cập nhật tiến trình của danh sách
        list.progress.totalCards = cards.length;
        list.progress.rememberedCards = rememberedCards;
        list.progress.percentage = averagePercentage;
        list.last_practice_date = new Date();

        await list.save();
    }
};

/**
 * Lấy thống kê học tập của người dùng
 */
exports.getLearningStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Lấy tất cả danh sách của người dùng
        const lists = await ListFlashCard.find({ userId });

        // Tính tổng số thẻ và số thẻ đã nhớ
        let totalCards = 0;
        let rememberedCards = 0;
        let learningCards = 0;
        let reviewingCards = 0;

        for (const list of lists) {
            totalCards += list.progress.totalCards;
            rememberedCards += list.progress.rememberedCards;

            // Lấy số lượng thẻ theo trạng thái
            const cards = await FlashCard.find({ _id: { $in: list.flashcards } });
            learningCards += cards.filter((c) => c.status === "learned").length;
            reviewingCards += cards.filter((c) => c.status === "reviewing").length;
        }

        // Tính thống kê luyện tập 7 ngày gần đây
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyStats = await FlashCard.aggregate([
            {
                $match: {
                    "history.date": { $gte: sevenDaysAgo },
                },
            },
            {
                $unwind: "$history",
            },
            {
                $match: {
                    "history.date": { $gte: sevenDaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$history.date" },
                    },
                    totalReviews: { $sum: 1 },
                    correctReviews: {
                        $sum: { $cond: [{ $eq: ["$history.result", true] }, 1, 0] },
                    },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        // Lấy thẻ được gợi ý ôn tập tiếp theo
        const dueCards = await FlashCard.find({
            _id: { $in: lists.flatMap((list) => list.flashcards) },
            nextReviewDate: { $lte: new Date() },
        }).countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalProgress: totalCards > 0 ? Math.round((rememberedCards / totalCards) * 100) : 0,
                cardStats: {
                    total: totalCards,
                    remembered: rememberedCards,
                    learning: learningCards,
                    reviewing: reviewingCards,
                },
                dueCards,
                dailyStats,
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê học tập:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message,
        });
    }
};

/**
 * Đặt lại tiến trình học tập cho một danh sách
 */
exports.resetListProgress = async (req, res) => {
    try {
        const { listId } = req.params;
        const userId = req.user._id;

        // Kiểm tra quyền sở hữu
        const list = await ListFlashCard.findOne({
            _id: listId,
            userId: userId,
        });

        if (!list) {
            return res.status(404).json({ message: "Không tìm thấy danh sách hoặc không có quyền truy cập" });
        }

        // Đặt lại trạng thái của tất cả thẻ trong danh sách
        await FlashCard.updateMany(
            { _id: { $in: list.flashcards } },
            {
                $set: {
                    status: "reviewing",
                    "progress.percentage": 0,
                    interval: 1,
                    nextReviewDate: new Date(),
                },
                $push: {
                    history: {
                        date: new Date(),
                        result: false,
                        note: "Đặt lại tiến trình",
                    },
                },
            }
        );

        // Đặt lại tiến trình của danh sách
        list.progress.rememberedCards = 0;
        list.progress.percentage = 0;
        list.last_practice_date = null;
        await list.save();

        res.status(200).json({
            success: true,
            message: "Đã đặt lại tiến trình học tập thành công",
        });
    } catch (error) {
        console.error("Lỗi khi đặt lại tiến trình:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message,
        });
    }
};

/**
 * Lấy tiến trình của một danh sách cụ thể
 */
exports.getListProgress = async (req, res) => {
    try {
        const { listId } = req.params;
        const userId = req.user._id;

        // Kiểm tra quyền sở hữu
        const list = await ListFlashCard.findOne({
            _id: listId,
            userId: userId,
        });

        if (!list) {
            return res.status(404).json({ message: "Không tìm thấy danh sách hoặc không có quyền truy cập" });
        }

        // Lấy thống kê chi tiết của danh sách
        const cards = await FlashCard.find({ _id: { $in: list.flashcards } });

        const statusCounts = {
            reviewing: cards.filter((c) => c.status === "reviewing").length,
            learned: cards.filter((c) => c.status === "learned").length,
            remembered: cards.filter((c) => c.status === "remembered").length,
        };

        // Tính số thẻ đến hạn ôn tập
        const dueCards = cards.filter((c) => c.nextReviewDate <= new Date()).length;

        // Tính toán ngày dự kiến hoàn thành (nếu học 10 thẻ mỗi ngày)
        const cardsLeft = list.progress.totalCards - list.progress.rememberedCards;
        const estimatedDays = Math.ceil(cardsLeft / 10);

        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + estimatedDays);

        res.status(200).json({
            success: true,
            data: {
                title: list.title,
                description: list.desc,
                progress: list.progress,
                statusCounts,
                dueCards,
                lastPracticed: list.last_practice_date,
                estimatedCompletion: estimatedDays > 0 ? completionDate : null,
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy tiến trình danh sách:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message,
        });
    }
};

module.exports = exports;
