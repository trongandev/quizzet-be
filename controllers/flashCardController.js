const { FlashCard, ListFlashCard } = require("../models/FlashCard"); // Đảm bảo đường dẫn chính xác
const CacheModel = require("../models/Cache");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SM2_Algorithm, determineCardStatus, calculatePercentage } = require("../services/SM2_Algorithm");
const dotenv = require("dotenv");
const User = require("../models/User");
const { handleCreateActivity } = require("../services/helperFunction");
const GamificationService = require("../services/gamificationService");
dotenv.config();

const setCache = async (key, data, ttl = 3600) => {
    const expireAt = new Date(Date.now() + ttl * 1000);
    await CacheModel.updateOne({ key }, { data: JSON.parse(JSON.stringify(data)), expireAt }, { upsert: true });
};

const getCache = async (key) => {
    const cachedData = await CacheModel.findOne({ key });
    return cachedData ? cachedData : null;
};

const deleteCache = async (key) => {
    await CacheModel.deleteOne({ key });
};

// AI create Flashcard

const genAI = new GoogleGenerativeAI(process.env.API_KEY_AI);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.translateAIEnhance = async (req, res) => {
    try {
        const { prompt } = req.body;

        const result = await model.generateContent(prompt);
        const parse = result.response.text();

        return res.status(200).json({ ok: true, message: "Dịch thuật thành công", parse });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcard", error: error.message });
    }
};

exports.createFlashCardAI = async (req, res) => {
    try {
        const { list_flashcard_id, prompt, language } = req.body;
        const { id } = req.user;
        const listFlashCard = await ListFlashCard.findById(list_flashcard_id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "List FlashCard not found" });
        }
        if (listFlashCard.userId.equals(id) === false) {
            return res.status(403).json({ message: "Bạn không có quyền tạo flashcard trong danh sách này" });
        }
        const result = await model.generateContent(prompt);
        const parse = result.response
            .text()
            .replace(/```json/g, "")
            .replace(/```/g, "");

        const data = JSON.parse(parse);

        const newFlashCard = new FlashCard({ ...data, userId: id.toString(), language: language });
        await handleCreateActivity(id, "flashcard", "Tạo flashcard bằng AI", newFlashCard._id.toString());
        listFlashCard.flashcards.push(newFlashCard._id);
        await deleteCache(`summary_${id}`);
        await newFlashCard.save();
        await listFlashCard.save();
        await GamificationService.addXpForTask(id, "ADD_WORD");
        return res.status(200).json({ ok: true, message: "Flashcard đã được tạo thành công", flashcard: newFlashCard });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcard", error: error.message });
    }
};

// --- FlashCard Controller ---

// Tạo một flashcard mới
exports.createFlashCard = async (req, res) => {
    try {
        const { list_flashcard_id, title, define, language, type_of_word, transcription, example, note } = req.body;
        const { id } = req.user;
        // Kiểm tra nếu thiếu dữ liệu bắt buộc
        if (!title) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc (tên từ, định nghĩa)" });
        }

        const newFlashCard = new FlashCard({
            userId: id.toString(),
            title,
            define,
            language,
            type_of_word,
            transcription,
            example,
            note,
            progress: {
                learnedTimes: 0,
                percentage: 0,
            },
        });

        const listFlashCard = await ListFlashCard.findById(list_flashcard_id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "List FlashCard not found" });
        }

        if (listFlashCard.userId.equals(id) === false) {
            return res.status(403).json({ message: "Bạn không có quyền tạo flashcard trong danh sách này" });
        }

        // Thêm flashcard mới vào danh sách flashcard
        listFlashCard.flashcards.push(newFlashCard._id);
        listFlashCard.progress.totalCards = (listFlashCard.progress.totalCards || 0) + 1;
        await deleteCache(`summary_${id}`);
        await handleCreateActivity(id, "flashcard", "Tạo flashcard", newFlashCard._id.toString());
        await newFlashCard.save();
        await listFlashCard.save();
        await GamificationService.addXpForTask(id, "ADD_WORD");

        return res.status(201).json({ ok: true, message: "Flashcard đã được tạo thành công", flashcard: newFlashCard });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcard", error: error.message });
    }
};
/**
 * @route PUT /api/flashcards/batch-rate
 * @description Cập nhật thuộc tính của nhiều flashcard một cách hàng loạt.
 * @param {Array<Object>} cards - Một mảng các đối tượng thẻ cần cập nhật.
 * Mỗi đối tượng có dạng: { id: string, quality: number, userId: string }
 */
exports.batchRate = async (req, res) => {
    try {
        const { cards } = req.body;
        const { id } = req.user;

        if (!Array.isArray(cards) || cards.length === 0) {
            return res.status(400).json({ message: "Vui lòng cung cấp một mảng thẻ hợp lệ để cập nhật." });
        }

        const bulkOperations = [];
        const errors = [];

        for (const cardUpdate of cards) {
            const { id, quality, userId } = cardUpdate;

            if (typeof quality === "undefined" || !id || !userId || userId === "default_user_id") {
                errors.push({ id, message: "Thiếu thông tin (id, quality, userId) hoặc userId không hợp lệ." });
                continue;
            }

            const currentCard = await FlashCard.findOne({ _id: id, userId: userId }).lean();

            if (!currentCard) {
                errors.push({ id, message: `Không tìm thấy flashcard với ID: ${id} hoặc bạn không có quyền truy cập.` });
                continue;
            }

            const { efactor, interval, repetitions } = SM2_Algorithm(currentCard.efactor, currentCard.interval, currentCard.repetitions, quality);

            const nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + interval);

            const newStatus = determineCardStatus(nextReviewDate, efactor);
            const newPercentage = calculatePercentage(quality, efactor); // Hoặc tính toán phức tạp hơn

            bulkOperations.push({
                updateOne: {
                    filter: { _id: id, userId: userId },
                    update: {
                        $set: {
                            efactor: efactor,
                            interval: interval,
                            repetitions: repetitions,
                            nextReviewDate: nextReviewDate,
                            status: newStatus,
                            "progress.learnedTimes": repetitions, // Cập nhật learnedTimes theo repetitions
                            "progress.percentage": newPercentage, // Cập nhật percentage
                        },
                        $push: {
                            // Thêm bản ghi vào lịch sử
                            history: {
                                date: new Date(),
                                quality: quality,
                            },
                        },
                    },
                },
            });
            await GamificationService.addXpForTask(userId, "REVIEW_CARD");
        }

        if (bulkOperations.length > 0) {
            const result = await FlashCard.bulkWrite(bulkOperations);
        }
        await deleteCache(`summary_${id}`);
        await handleCreateActivity(id, "flashcard", "luyện tập flashcard", null);
        if (errors.length > 0) {
            res.status(200).json({
                message: "Đã cập nhật một phần các flashcard, nhưng có lỗi xảy ra với một số thẻ.",
                errors: errors,
            });
        } else {
            res.status(200).json({ message: "Tất cả flashcard đã được cập nhật thành công." });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật flashcards hàng loạt:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật flashcards hàng loạt.", error: error.message });
    }
};

// Tạo nhiều danh sách flashcard mới
exports.createListFlashCards = async (req, res) => {
    try {
        const { list_flashcard_id, language, data } = req.body; // Nhận danh sách flashcard từ request
        const { id } = req.user;

        // Kiểm tra nếu thiếu dữ liệu bắt buộc
        if (!list_flashcard_id) {
            return res.status(400).json({ message: "Không có id flashcard này!!" });
        }

        const listFlashCard = await ListFlashCard.findById(list_flashcard_id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "Tìm không thấy flashcard này, vui lòng f5 lại trang" });
        }

        const createdFlashcards = [];

        // Lặp qua danh sách flashcard để tạo từng cái
        for (const flashcardData of data) {
            const { title, define, type_of_word, transcription, level, example, note } = flashcardData;

            // Kiểm tra thông tin bắt buộc
            if (!title || !define) {
                return res.status(400).json({ message: "flashcard cần có title và define" });
            }

            const newFlashCard = new FlashCard({
                userId: id.toString(),
                title,
                define,
                language,
                type_of_word,
                transcription,
                level,
                example,
                note,
            });

            await newFlashCard.save(); // Lưu flashcard vào cơ sở dữ liệu
            await GamificationService.addXpForTask(id, "ADD_WORD");
            listFlashCard.flashcards.push(newFlashCard._id); // Thêm flashcard ID vào danh sách
            createdFlashcards.push(newFlashCard); // Lưu flashcard đã tạo vào danh sách kết quả
        }

        await listFlashCard.save(); // Lưu danh sách flashcard

        await deleteCache(`summary_${id}`);
        await handleCreateActivity(id, "flashcard", "Tạo flashcard hàng loạt", list_flashcard_id);
        return res.status(200).json({
            ok: true,
            message: "Các flashcard đã được tạo thành công",
            flashcards: createdFlashcards,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcards", error: error.message });
    }
};

// Lấy flashcard theo ID
exports.getFlashCardById = async (req, res) => {
    try {
        const { id } = req.params;

        const listFlashCards = await ListFlashCard.findById(id)
            .populate({
                path: "flashcards",
                options: { sort: { created_at: -1 } },
            })
            .populate("userId", "_id displayName profilePicture");
        // 1. Số từ theo trạng thái (đã nhớ, cần ôn tập, đã học thuộc)
        const statusCounts = {
            reviewing: 0, // cần ông tập, đang ôn tập
            remembered: 0, // đang ghi nhớ
            learned: 0, // đã nhớ đã học thuộc
        };

        listFlashCards.flashcards.forEach((card) => {
            statusCounts[card.status] = (statusCounts[card.status] || 0) + 1;
        });

        if (!listFlashCards) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards cho người dùng này" });
        }

        return res.status(200).json({ ok: true, listFlashCards, statusCounts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

exports.getFlashCardByIdToPractive = async (req, res) => {
    try {
        const { fc_id } = req.params;
        const list_flashcard = await ListFlashCard.findById(fc_id).populate("flashcards");
        if (!list_flashcard) {
            return res.status(404).json({ message: "Không tìm thấy flashcard này" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cardsDueToday = list_flashcard.flashcards.filter((card) => new Date(card.nextReviewDate) <= today);
        cardsDueToday.sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());

        return res.status(200).json({ ok: true, listFlashCards: cardsDueToday });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

exports.getFlashCardToPractive = async (req, res) => {
    try {
        const { id } = req.user;
        const fetchedCards = await FlashCard.find({ userId: id }).lean();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cardsDueToday = fetchedCards.filter((card) => new Date(card.nextReviewDate) <= today);
        cardsDueToday.sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());

        return res.status(200).json({ ok: true, listFlashCards: cardsDueToday });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};
// Cập nhật flashcard
exports.updateFlashCard = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const flashcard = await FlashCard.findByIdAndUpdate(id, updateData, { new: true });

        if (!flashcard) {
            return res.status(404).json({ message: "Không tìm thấy flashcard này để cập nhật" });
        }

        return res.status(200).json({ message: "Flashcard đã được cập nhật", flashcard });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi cập nhật flashcard", error: error.message });
    }
};

// Xóa flashcard
exports.deleteFlashCard = async (req, res) => {
    try {
        const { _id } = req.params;
        const { id } = req.user;

        const flashcard = await FlashCard.findByIdAndDelete(_id);

        if (!flashcard) {
            return res.status(404).json({ message: "Không tìm thấy từ này để xóa" });
        }
        await handleCreateActivity(id, "flashcard", "Xóa flashcard", flashcard._id.toString());

        return res.status(200).json({ ok: true, message: `Từ ${flashcard.title} đã được xóa thành công` });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi xóa flashcard", error: error.message });
    }
};

// --- ListFlashCard Controller ---

// Tạo một danh sách flashcard mới
exports.createListFlashCard = async (req, res) => {
    try {
        const { title, language, desc, public } = req.body;
        const { id } = req.user;

        // Kiểm tra nếu thiếu dữ liệu bắt buộc
        if (!title) {
            return res.status(400).json({ message: "Vui lòng nhập tiêu đề" });
        }

        const newListFlashCard = new ListFlashCard({
            userId: id,
            title,
            language,
            desc,
            public,
        });
        await newListFlashCard.save();
        const result = await ListFlashCard.findById(newListFlashCard._id).populate("flashcards").populate("userId", "_id displayName profilePicture");
        await handleCreateActivity(id, "flashcard", "Tạo danh sách flashcard", newListFlashCard._id.toString());
        return res.status(201).json({ ok: true, message: "Danh sách flashcards đã được tạo thành công", listFlashCard: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi tạo danh sách flashcards", error: error.message });
    }
};

// Lấy tất cả danh sách flashcard của một người dùng
exports.getAllListFlashCards = async (req, res) => {
    try {
        const { id } = req.user;

        const listFlashCards = await ListFlashCard.find({ userId: id })
            .sort({ created_at: -1 })
            .populate("flashcards", "_id status history nextReviewDate")
            .populate("userId", "_id displayName profilePicture")
            .lean(); // Thêm lean() để trả về plain object

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 3. Tỉ lệ đúng của từ trong từng bộ list flashcard
        listFlashCards.forEach((list) => {
            let totalCorrectReviews = 0;
            let totalAllReviews = 0;
            let countCardsDueToday = 0;

            list.flashcards.forEach((card) => {
                if (card.history && card.history.length > 0) {
                    totalAllReviews += card.history.length;
                    totalCorrectReviews += card.history.filter((h) => h.quality >= 3).length;
                }
                if (new Date(card.nextReviewDate) <= today) {
                    countCardsDueToday++;
                }
            });

            list.accuracyPercentage = totalAllReviews === 0 ? 0 : Math.round((totalCorrectReviews / totalAllReviews) * 100);
            list.countCardsDueToday = countCardsDueToday;
        });

        return res.status(200).json({ ok: true, listFlashCards });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

exports.getAllListFlashCardsWithExtension = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id).select("_id displayName profilePicture").lean().exec();
        if (!user) {
            return res.status(404).json({ ok: false, message: "Người dùng không tìm thấy" });
        }
        const listFlashCards = await ListFlashCard.find({ userId: id }).sort({ created_at: -1 }).select("_id title language").lean().exec();

        if (!listFlashCards) {
            return res.status(404).json({ ok: false, message: "Không tìm thấy danh sách flashcards cho người dùng này" });
        }

        return res.status(200).json({ ok: true, listFlashCards, user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Lấy danh sách flashcard theo ID
exports.getListFlashCardById = async (req, res) => {
    try {
        const { id } = req.params;

        const listFlashCard = await ListFlashCard.findById(id).populate("flashcards");

        if (!listFlashCard) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards này" });
        }

        return res.status(200).json(listFlashCard);
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Cập nhật danh sách flashcard
exports.updateListFlashCard = async (req, res) => {
    try {
        const { _id } = req.params;
        const updateData = req.body;
        console.log("Update data:", updateData);
        const cacheKey = `listFlashCards_${_id}`;
        const listFlashCard = await ListFlashCard.findByIdAndUpdate(_id, updateData, { new: true });

        if (!listFlashCard) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards này để cập nhật" });
        }
        await deleteCache(cacheKey);

        return res.status(200).json({ ok: true, message: "Danh sách flashcards đã được cập nhật", listFlashCard });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi cập nhật danh sách flashcards", error: error.message });
    }
};

// Xóa danh sách flashcard
exports.deleteListFlashCard = async (req, res) => {
    try {
        const _id = req.params.id;
        const { id } = req.user;

        // 1. Tìm danh sách flashcard và kiểm tra quyền sở hữu
        const listToDelete = await ListFlashCard.findOne({ _id: _id, userId: id });

        if (!listToDelete) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcard để xóa hoặc bạn không có quyền." });
        }

        // 2. Lấy danh sách các ID của thẻ flashcard trong danh sách
        const cardIdsToDelete = listToDelete.flashcards;

        // 3. Xóa các thẻ flashcard liên quan
        if (cardIdsToDelete && cardIdsToDelete.length > 0) {
            const deleteCardsResult = await FlashCard.deleteMany({ _id: { $in: cardIdsToDelete }, userId: id });
        }

        // 4. Xóa danh sách flashcard đó
        const deleteListResult = await ListFlashCard.deleteOne({ _id: _id, userId: id });

        if (deleteListResult.deletedCount === 0) {
            // Trường hợp này hiếm khi xảy ra nếu listToDelete đã được tìm thấy
            return res.status(404).json({ message: "Lỗi không xác định khi xóa danh sách." });
        }
        await handleCreateActivity(id, "flashcard", "Xóa danh sách flashcard", _id);
        await deleteCache(`summary_${id}`);

        return res.status(200).json({
            ok: true,
            message: "Danh sách flashcard và các thẻ liên quan đã được xóa thành công.",
            deletedListId: _id,
            deletedCardsCount: cardIdsToDelete ? cardIdsToDelete.length : 0,
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi xóa danh sách flashcards", error: error.message });
    }
};

// Lấy tất cả flashcard ở chế độ public
exports.getAllFlashCardsPublic = async (req, res) => {
    try {
        const cacheKey = `publicFlashcards`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData.data);
        }

        const publicFlashcards = await ListFlashCard.find({ public: true }).populate("userId", "_id displayName profilePicture").sort({ created_at: -1 });
        await setCache(cacheKey, publicFlashcards);

        return res.status(200).json(publicFlashcards);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Lấy tất cả flashcard
exports.getAllFlashCards = async (req, res) => {
    try {
        const cacheKey = `publicFlashcardsAll`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({ ok: true, publicFlashcards: cachedData.data });
        }
        const publicFlashcards = await ListFlashCard.find().populate("userId", "_id displayName profilePicture").sort({ created_at: -1 }).exec();

        await setCache(cacheKey, publicFlashcards);

        return res.status(200).json({ ok: true, publicFlashcards });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

/**
 * @route GET /api/statistics/summary
 * @description Lấy tóm tắt thống kê học tập của người dùng.
 * Bao gồm: số từ đã học trong tuần, số từ theo trạng thái, tỉ lệ đúng của từng từ.
 * @param {string} userId (trong query) - ID của người dùng.
 */
exports.statisticsSumarry = async (req, res) => {
    try {
        const { id: userId } = req.user;
        if (!userId || userId === "default_user_id") {
            return res.status(400).json({ message: "Vui lòng cung cấp User ID hợp lệ." });
        }

        // // Kiểm tra cache trước
        // const cachedSummary = await getCache(`summary_${userId}`);
        // if (cachedSummary) {
        //     return res.status(200).json(cachedSummary.data);
        // }

        // Lấy tất cả flashcards của người dùng
        const allFlashcards = await FlashCard.find({ userId: userId }).lean();

        const learnedWords = [];
        const rememberedWords = [];
        const reviewingWords = [];

        allFlashcards.forEach((card) => {
            const wordData = { _id: card._id, title: card.title, define: card.define, transcription: card.transcriptin, nextReviewDate: card.nextReviewDate };

            switch (card.status) {
                case "learned":
                    learnedWords.push(wordData);
                    break;
                case "remembered":
                    rememberedWords.push(wordData);
                    break;
                case "reviewing":
                    reviewingWords.push(wordData);
                    break;
            }
        });

        // 2. Những từ vựng đã học trong 1 tuần (có ít nhất 1 lần ôn tập trong 7 ngày qua)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const weeklyReviewedWords = new Set();
        allFlashcards.forEach((card) => {
            if (card.history && card.history.some((h) => new Date(h.date) >= oneWeekAgo)) {
                weeklyReviewedWords.add(card._id.toString());
            }
        });
        const weeklyReviewedWordsCount = weeklyReviewedWords.size;

        // 3. Tỉ lệ đúng của tất cả các từ
        let totalCorrectReviews = 0;
        let totalAllReviews = 0;

        allFlashcards.forEach((card) => {
            if (card.history && card.history.length > 0) {
                totalAllReviews += card.history.length;
                totalCorrectReviews += card.history.filter((h) => h.quality >= 3).length; // Quality >= 3 là đúng
            }
        });

        const overallAccuracyPercentage = totalAllReviews === 0 ? 0 : Math.round((totalCorrectReviews / totalAllReviews) * 100);

        const wordAccuracy = {
            totalReviews: totalAllReviews,
            correctReviews: totalCorrectReviews,
            accuracyPercentage: overallAccuracyPercentage,
        };

        await setCache(`summary_${userId}`, { weeklyReviewedWordsCount, wordAccuracy, learnedWords });

        res.status(200).json({
            weeklyReviewedWordsCount: weeklyReviewedWordsCount,
            wordAccuracy: wordAccuracy,
            words: {
                learnedWords,
                rememberedWords,
                reviewingWords,
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê tổng hợp:", error);
        res.status(500).json({ message: "Lỗi server khi lấy thống kê tổng hợp.", error: error.message });
    }
};
