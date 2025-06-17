const { FlashCard, ListFlashCard } = require("../models/FlashCard"); // Đảm bảo đường dẫn chính xác
const CacheModel = require("../models/Cache");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();
// Hằng số cho việc đánh giá progress
const PROGRESS_THRESHOLDS = {
    MASTERY: 80, // Ngưỡng để coi là đã thuộc (80%)
    NEEDS_REVIEW: 30, // Ngưỡng để đưa vào danh sách ôn tập (<30%)
    MIN_CORRECT_ANSWERS: 2, // Số lần trả lời đúng tối thiểu
};

const REVIEW_INTERVALS = {
    UNKNOWN: 3, // Số lần ôn tập cho từ chưa biết
    FAMILIAR: 2, // Số lần ôn tập cho từ tương đối
};

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

exports.createFlashCardAI = async (req, res) => {
    try {
        const { list_flashcard_id, prompt } = req.body;
        const { id } = req.user;

        const result = await model.generateContent(prompt);
        const parse = result.response
            .text()
            .replace(/```json/g, "")
            .replace(/```/g, "");

        const data = JSON.parse(parse);

        const newFlashCard = new FlashCard(data);

        const listFlashCard = await ListFlashCard.findById(list_flashcard_id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "List FlashCard not found" });
        }

        listFlashCard.flashcards.push(newFlashCard._id);
        await newFlashCard.save();
        await listFlashCard.save();
        await deleteCache(`list_flashcard_${list_flashcard_id}`);
        await deleteCache(`listFlashcardUser_${id}`);

        return res.status(200).json({ ok: true, message: "Flashcard đã được tạo thành công", flashcard: newFlashCard });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcard", error: error.message });
    }
};

// --- FlashCard Controller ---

// Tạo một flashcard mới
exports.createFlashCard = async (req, res) => {
    try {
        const { list_flashcard_id, title, define, type_of_word, transcription, example, note } = req.body;
        const { id } = req.user;
        // Kiểm tra nếu thiếu dữ liệu bắt buộc
        if (!title) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc (tên từ, định nghĩa)" });
        }

        const newFlashCard = new FlashCard({
            title,
            define,
            type_of_word,
            transcription,
            example,
            note,
        });

        const listFlashCard = await ListFlashCard.findById(list_flashcard_id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "List FlashCard not found" });
        }

        // Thêm flashcard mới vào danh sách flashcard
        listFlashCard.flashcards.push(newFlashCard._id);
        await newFlashCard.save();
        await listFlashCard.save();
        await deleteCache(`list_flashcard_${list_flashcard_id}`);
        await deleteCache(`listFlashcardUser_${id}`);
        return res.status(201).json({ message: "Flashcard đã được tạo thành công", flashcard: newFlashCard });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcard", error: error.message });
    }
};

// Tạo nhiều danh sách flashcard mới
exports.createListFlashCards = async (req, res) => {
    try {
        const { list_flashcard_id, prompt } = req.body; // Nhận danh sách flashcard từ request
        const { id } = req.user;

        // Kiểm tra nếu thiếu dữ liệu bắt buộc
        if (!list_flashcard_id) {
            return res.status(400).json({ message: "Không có id flashcard này!!" });
        }

        const result = await model.generateContent(prompt);
        const parse = result.response
            .text()
            .replace(/```json/g, "")
            .replace(/```/g, "");

        const data = JSON.parse(parse);
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "Dữ liệu flashcard không hợp lệ hoặc rỗng" });
        }
        const listFlashCard = await ListFlashCard.findById(list_flashcard_id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "Tìm không thấy flashcard này, vui lòng f5 lại trang" });
        }

        const createdFlashcards = [];

        // Lặp qua danh sách flashcard để tạo từng cái
        for (const flashcardData of data) {
            const { title, define, type_of_word, transcription, example, note } = flashcardData;

            // Kiểm tra thông tin bắt buộc
            if (!title || !define) {
                return res.status(400).json({ message: "flashcard cần có title và define" });
            }

            const newFlashCard = new FlashCard({
                title,
                define,
                type_of_word,
                transcription,
                example,
                note,
            });

            await newFlashCard.save(); // Lưu flashcard vào cơ sở dữ liệu
            listFlashCard.flashcards.push(newFlashCard._id); // Thêm flashcard ID vào danh sách
            createdFlashcards.push(newFlashCard); // Lưu flashcard đã tạo vào danh sách kết quả
        }

        await listFlashCard.save(); // Lưu danh sách flashcard
        await deleteCache(`list_flashcard_${list_flashcard_id}`);
        await deleteCache(`listFlashcardUser_${id}`);

        return res.status(200).json({
            ok: true,
            message: "Các flashcard đã được tạo thành công",
            flashcards: createdFlashcards,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcards", error: error.message });
    }
};

// Lấy flashcard theo ID
exports.getFlashCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `list_flashcard_${id}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({ ok: true, listFlashCards: cachedData.data });
        }

        const listFlashCards = await ListFlashCard.findById(id).populate("flashcards").populate("userId", "_id displayName profilePicture");

        if (!listFlashCards) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards cho người dùng này" });
        }

        await setCache(cacheKey, listFlashCards);

        return res.status(200).json({ ok: true, listFlashCards });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// // Lấy flashcard theo User
// exports.getFlashCardByUser = async (req, res) => {
//     try {
//         const { id } = req.user;
//         const flashcard = await FlashCard.find({ userId: id }).sort({ created_at: -1 });

//         if (!flashcard) {
//             return res.status(404).json({ message: "Không tìm thấy flashcard này" });
//         }

//         return res.status(200).json({ ok: true, flashcard });
//     } catch (error) {
//         return res.status(500).json({ message: "Lỗi khi lấy flashcard", error: error.message });
//     }
// };

// Cập nhật flashcard
exports.updateFlashCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_flashcard, updateData } = req.body;
        const flashcard = await FlashCard.findByIdAndUpdate(id, updateData, { new: true });

        if (!flashcard) {
            return res.status(404).json({ message: "Không tìm thấy flashcard này để cập nhật" });
        }
        await deleteCache(`list_flashcard_${id_flashcard}`);
        return res.status(200).json({ message: "Flashcard đã được cập nhật", flashcard });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi cập nhật flashcard", error: error.message });
    }
};

// Xóa flashcard
exports.deleteFlashCard = async (req, res) => {
    try {
        const { list_flashcard_id } = req.body;
        const { _id } = req.params;
        const { id } = req.user;

        const flashcard = await FlashCard.findByIdAndDelete(_id);

        if (!flashcard) {
            return res.status(404).json({ message: "Không tìm thấy từ này để xóa" });
        }
        await deleteCache(`list_flashcard_${list_flashcard_id}`);
        await deleteCache(`listFlashcardUser_${id}`);
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
        const cacheKey = "publicFlashcards";

        await deleteCache(cacheKey);
        await deleteCache(`listFlashcardUser_${id}`);

        return res.status(201).json({ ok: true, message: "Danh sách flashcards đã được tạo thành công", listFlashCard: result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi tạo danh sách flashcards", error: error.message });
    }
};

// Lấy tất cả danh sách flashcard của một người dùng
exports.getAllListFlashCards = async (req, res) => {
    try {
        const { id } = req.user;
        const cacheKey = `listFlashcardUser_${id}`;

        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({ ok: true, listFlashCards: cachedData.data });
        }

        const listFlashCards = await ListFlashCard.find({ userId: id }).populate("flashcards", "_id").populate("userId", "_id displayName profilePicture");

        if (!listFlashCards) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards cho người dùng này" });
        }

        await setCache(cacheKey, listFlashCards);

        return res.status(200).json({ ok: true, listFlashCards });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Lấy danh sách flashcard theo ID
exports.getListFlashCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `listFlashCards_${id}`;

        const cachedData = await getCache(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData.data);
        }
        const listFlashCard = await ListFlashCard.findById(id).populate("flashcards");

        if (!listFlashCard) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards này" });
        }

        await setCache(cacheKey, listFlashCard);

        return res.status(200).json(listFlashCard);
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Cập nhật danh sách flashcard
exports.updateListFlashCard = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const cacheKey = `listFlashCards_${id}`;
        const listFlashCard = await ListFlashCard.findByIdAndUpdate(id, updateData, { new: true });

        if (!listFlashCard) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards này để cập nhật" });
        }
        await deleteCache(cacheKey);

        return res.status(200).json({ message: "Danh sách flashcards đã được cập nhật", listFlashCard });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi cập nhật danh sách flashcards", error: error.message });
    }
};

// Xóa danh sách flashcard
exports.deleteListFlashCard = async (req, res) => {
    try {
        const _id = req.params.id;
        const { id } = req.user;
        const cacheKey = `listFlashCards_${_id}`;
        const cacheKey1 = `listFlashcardUser_${id}`;
        const listFlashCard = await ListFlashCard.findByIdAndDelete(_id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards này để xóa" });
        }
        await deleteCache(cacheKey);
        await deleteCache(cacheKey1);

        return res.status(200).json({ ok: true, message: "Danh sách flashcards đã được xóa thành công" });
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
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Lấy tất cả flashcard
exports.getAllFlashCards = async (req, res) => {
    try {
        const cacheKey = `publicFlashcardsAll`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData.data);
        }
        const publicFlashcards = await ListFlashCard.find().populate("userId", "_id displayName profilePicture").sort({ created_at: -1 });

        await setCache(cacheKey, publicFlashcards);

        return res.status(200).json(publicFlashcards);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Cập nhật tiến trình của FlashCard
const updateFlashCardProgress = async (req, res) => {
    try {
        const { flashCardId } = req.params;
        const { result } = req.body; // Kết quả học (true: đúng, false: sai)

        const flashCard = await FlashCard.findById(flashCardId);
        if (!flashCard) {
            return res.status(404).json({ message: "FlashCard not found" });
        }

        // Cập nhật lịch sử và tiến trình
        flashCard.progress.learnedTimes += 1;
        flashCard.history.push({ result });
        const correctCount = flashCard.history.filter((h) => h.result).length;
        const totalAttempts = flashCard.history.length;
        flashCard.progress.percentage = Math.round((correctCount / totalAttempts) * 100);

        // Cập nhật trạng thái
        if (flashCard.progress.percentage >= 80) {
            flashCard.status = "remembered";
        } else if (flashCard.progress.percentage >= 30) {
            flashCard.status = "learned";
        } else {
            flashCard.status = "reviewing";
        }

        await flashCard.save();
        res.status(200).json({ message: "Progress updated", flashCard });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Cập nhật tiến trình của ListFlashCard
const updateListProgress = async (listId) => {
    const list = await ListFlashCard.findById(listId).populate("flashcards");
    if (!list) throw new Error("ListFlashCard not found");

    const totalCards = list.flashcards.length;
    const rememberedCards = list.flashcards.filter((fc) => fc.status === "remembered").length;
    const percentage = Math.round((rememberedCards / totalCards) * 100);

    list.progress = { totalCards, rememberedCards, percentage };
    await list.save();
};

// Gọi cập nhật danh sách khi flashcard thay đổi
exports.updateFlashCardAndListProgress = async (req, res) => {
    try {
        const { flashCardId, listId } = req.params;
        const { result } = req.body;

        await updateFlashCardProgress(req, res); // Cập nhật FlashCard
        await updateListProgress(listId); // Cập nhật ListFlashCard

        res.status(200).json({ message: "Progress updated for flashcard and list" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Luyện tập flashcards trong một danh sách
exports.practiceFlashCard = async (req, res) => {
    try {
        const { listId } = req.params; // ID của danh sách flashcards
        const userId = req.user.id; // ID người dùng từ token (xác thực)

        const list = await ListFlashCard.findOne({ _id: listId, userId });
        if (!list) {
            return res.status(404).json({ message: "List not found" });
        }

        // Kiểm tra ngày hiện tại với `last_practice_date`
        const today = moment().startOf("day");
        const lastPracticeDate = list.last_practice_date ? moment(list.last_practice_date).startOf("day") : null;

        if (lastPracticeDate && today.isSame(lastPracticeDate)) {
            // Đã luyện tập hôm nay
            return res.status(200).json({ message: "You have already practiced today" });
        }

        // Nếu chưa luyện tập, cập nhật tiến trình và lưu ngày
        list.last_practice_date = today;
        await list.save();

        // Xử lý logic cập nhật tiến trình flashcards (ví dụ tính % thuộc)
        await updateListProgress(listId); // Hàm cập nhật tiến trình

        res.status(200).json({ message: "Practice saved successfully", list });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
