const { FlashCard, ListFlashCard } = require("../models/FlashCard"); // Đảm bảo đường dẫn chính xác

// --- FlashCard Controller ---

// Tạo một flashcard mới
exports.createFlashCard = async (req, res) => {
    try {
        const { list_flashcard_id, title, define, type_of_word, transcription, example, note } = req.body;
        console.log(req.body);
        // Kiểm tra nếu thiếu dữ liệu bắt buộc
        if (!title || !define) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc (title, define)" });
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
        console.log(newFlashCard);
        await newFlashCard.save();
        await listFlashCard.save();

        return res.status(201).json({ message: "Flashcard đã được tạo thành công", flashcard: newFlashCard });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi tạo flashcard", error: error.message });
    }
};

// Lấy flashcard theo ID
exports.getFlashCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const listFlashCards = await ListFlashCard.findById(id).populate("flashcards").populate("userId", "_id displayName profilePicture");

        if (!listFlashCards) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards cho người dùng này" });
        }

        return res.status(200).json({ ok: true, listFlashCards });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};

// Lấy flashcard theo User
exports.getFlashCardByUser = async (req, res) => {
    try {
        const { id } = req.user;
        const flashcard = await FlashCard.find({ userId: id }).sort({ created_at: -1 });

        if (!flashcard) {
            return res.status(404).json({ message: "Không tìm thấy flashcard này" });
        }

        return res.status(200).json({ ok: true, flashcard });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi lấy flashcard", error: error.message });
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
        const { id } = req.params;
        const flashcard = await FlashCard.findByIdAndDelete(id);

        if (!flashcard) {
            return res.status(404).json({ message: "Không tìm thấy từ này để xóa" });
        }

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
        const listFlashCards = await ListFlashCard.find({ userId: id }).populate("flashcards", "_id").populate("userId", "_id displayName profilePicture");

        if (!listFlashCards) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards cho người dùng này" });
        }
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
        const { id } = req.params;
        const updateData = req.body;

        const listFlashCard = await ListFlashCard.findByIdAndUpdate(id, updateData, { new: true });

        if (!listFlashCard) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards này để cập nhật" });
        }

        return res.status(200).json({ message: "Danh sách flashcards đã được cập nhật", listFlashCard });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi cập nhật danh sách flashcards", error: error.message });
    }
};

// Xóa danh sách flashcard
exports.deleteListFlashCard = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("delete", id);
        const listFlashCard = await ListFlashCard.findByIdAndDelete(id);

        if (!listFlashCard) {
            return res.status(404).json({ message: "Không tìm thấy danh sách flashcards này để xóa" });
        }

        return res.status(200).json({ ok: true, message: "Danh sách flashcards đã được xóa thành công" });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi xóa danh sách flashcards", error: error.message });
    }
};

// Lấy tất cả flashcard ở chế độ public
exports.getAllFlashCardsPublic = async (req, res) => {
    try {
        const publicFlashcards = await ListFlashCard.find({ public: true }).populate("userId", "_id displayName profilePicture").sort({ created_at: -1 });
        if (!publicFlashcards) {
            return res.status(404).json({ message: "Chưa có flashcard nào được tạo" });
        }

        return res.status(200).json({ ok: true, publicFlashcards });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Lỗi khi lấy danh sách flashcards", error: error.message });
    }
};
