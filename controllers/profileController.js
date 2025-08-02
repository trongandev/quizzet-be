const User = require("../models/User");
const { QuizModel, DataQuizModel } = require("../models/Quiz");
const { ListFlashCard, FlashCard } = require("../models/FlashCard");
const { Achievement, Level } = require("../models/GamificationProfile");
const { GamificationProfile } = require("../models/GamificationProfile");
const { getTaskDefinitions } = require("../utils/taskCache");
const Notification = require("../models/Notification");
const { Chat } = require("../models/Chat");
const ActivityModel = require("../models/Activity");
const { getActivitiesByAction } = require("../services/helperFunction");
// const { sendFeedbackMail, sendOTPMail } = require("../services/nodemailer");
const getAllProfile = async (req, res) => {
    try {
        const user = await User.find().select("-password").sort({ created_at: -1 }).exec();
        res.status(200).json({ user, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id).select("displayName profilePicture role email").lean().exec();
        const quiz = await QuizModel.find({ uid: id }).sort({ date: -1 }).lean();
        const flashcards = await ListFlashCard.find({ userId: id })
            .sort({ created_at: -1 })
            .populate("flashcards", "_id status history nextReviewDate")
            .populate("userId", "_id displayName profilePicture")
            .lean(); // Thêm lean() để trả về plain object

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 3. Tỉ lệ đúng của từ trong từng bộ list flashcard
        flashcards.forEach((list) => {
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
        const gamificationProfile = await GamificationProfile.findOne({ user_id: id })
            .populate({
                path: "achievements.achievement", // Lấy thông tin chi tiết của achievement
                model: "Achievement", // Từ model Achievement
            })
            .lean();
        const achievements = await Achievement.find().lean();
        const levels = await Level.find().lean().sort({ level: 1 });
        const tasks = await getTaskDefinitions();
        const countFlashcard = await FlashCard.countDocuments({ userId: id });

        const activities = await getActivitiesByAction(id, 3); // Lấy activities trong 3 ngày gần đây
        if (!user) {
            return res.status(404).json({ msg: "Người dùng không tìm thấy" });
        }
        res.status(200).json({ user, quiz, flashcards, gamificationProfile, achievements, levels, tasks, activities, countFlashcard, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getAnythingInProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const { page = 1, limit = 10 } = req.query; // Phân trang
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: id }).populate("sender", "_id profilePicture displayName").sort({ created_at: -1 }).lean();

        // Đếm số lượng thông báo chưa đọc
        const unreadCount = await Notification.countDocuments({
            recipient: id,
            is_read: false,
        });
        const gamificationProfile = await GamificationProfile.findOne({ user_id: id })
            .populate({
                path: "achievements.achievement", // Lấy thông tin chi tiết của achievement
                model: "Achievement", // Từ model Achievement
            })
            .lean();

        // Lấy danh sách chat
        const chats = await Chat.find({ "participants.userId": id })
            .populate("participants.userId", "displayName profilePicture") // Lấy thông tin người tham gia
            .sort({ last_message_date: -1 }) // Sắp xếp theo thời gian tin nhắn gần nhất
            .skip(skip)
            .limit(parseInt(limit))
            .select("participants last_message last_message_date is_read")
            .lean();

        // Đếm số lượng chat chưa đọc
        const unreadCountChat = await Chat.countDocuments({
            "participants.userId": id,
            is_read: false, // Chỉ lấy những chat chưa đọc
        });

        res.status(200).json({ ok: true, gamificationProfile, notifications, unreadCount, chats, unreadCountChat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getOneProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id).select("_id displayName profilePicture role email").populate("gamification").lean().exec();

        res.status(200).json({ user, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const findProfileByName = async (req, res) => {
    try {
        const { text } = req.params;
        const { id } = req.user;
        // Sử dụng $regex để tìm kiếm gần đúng và $options: 'i' để không phân biệt chữ hoa thường
        const users = await User.find({
            displayName: { $regex: text, $options: "i" },
            _id: { $ne: id }, // Loại trừ người dùng hiện tại
        })
            .select("-password")
            .populate("displayName profilePicture");

        res.status(200).json({ users, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ ok: false, msg: "Thiếu userId trong tham số" });
        }
        const user = await User.findById(id).select("-password").populate("displayName profilePicture");
        const quiz = await QuizModel.find({ uid: id }).sort({ date: -1 }).lean();
        const flashcards = await ListFlashCard.find({ userId: id }).populate("userId").sort({ created_at: -1 }).lean();
        const gamificationProfile = await GamificationProfile.findOne({ user_id: id })
            .populate({
                path: "achievements.achievement", // Lấy thông tin chi tiết của achievement
                model: "Achievement", // Từ model Achievement
            })
            .lean();
        const achievements = await Achievement.find().lean();
        const levels = await Level.find().lean().sort({ level: 1 });
        const tasks = getTaskDefinitions();
        const countFlashcard = await FlashCard.countDocuments({ userId: id });

        const activities = await getActivitiesByAction(id, 3); // Lấy activities trong 3 ngày gần đây
        if (!user) {
            return res.status(404).json({ msg: "Người dùng không tìm thấy" });
        }
        res.status(200).json({ user, quiz, flashcards, gamificationProfile, achievements, levels, tasks, activities, countFlashcard, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { status, profilePicture, verify, role, displayName } = req.body;
        const { id } = req.user;
        const updateFields = {}; // Tạo đối tượng rỗng để chứa các trường cần cập nhật

        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({ message: "Người dùng không tồn tại" });
        }

        if (displayName !== undefined) updateFields.displayName = displayName;
        if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
        if (verify !== undefined) updateFields.verify = verify;
        if (role !== undefined) updateFields.role = role;
        if (status !== undefined) updateFields.status = status;

        const update_profile = await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
        if (!update_profile) {
            return res.status(400).json({ message: "Cập nhật thông tin không thành công" });
        }
        return res.status(200).json({ ok: true, message: "Cập nhật thành công", update_profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const sendMail = async (req, res) => {
    try {
        // const { id } = req.user;
        // if (!id) {
        //     return res.status(400).json({ msg: "Thiếu userId trong tham số" });
        // }
        // const user = await User.findById(id);
        // if (!user) {
        //     return res.status(404).json({ msg: "Người dùng không tìm thấy" });
        // }

        // if (user.verify) {
        //     return res.status(400).json({ message: "Tài khoản đã được xác thực" });
        // }

        // //create random otp code
        // const otp = Math.floor(100000 + Math.random() * 900000);
        // //thời hạn 10 phút
        // user.expire_otp = Date.now() + 1000 * 60 * 10;
        // user.otp = otp;
        // await user.save();
        // await sendOTPMail(user);
        return res.status(400).json({ message: "Tính năng đang bảo trì" });

        // res.status(200).json({ message: "Gửi mail thành công", ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const checkOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const { id } = req.user;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: "Người dùng không tìm thấy" });
        }
        if (user.otp != otp) {
            return res.status(400).json({ message: "Mã OTP không đúng" });
        }
        if (user.expire_otp < Date.now()) {
            return res.status(400).json({ message: "Mã OTP đã hết hạn" });
        }
        user.verify = true;
        await user.save();
        res.status(200).json({ message: "Xác thực thành công", ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const sendMailContribute = async (req, res) => {
    try {
        const { username, feedback } = req.body;
        if (!feedback) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ nội dung trước khi gửi" });
        }
        return res.status(400).json({ message: "Tính năng đang bảo trì" });

        // await sendFeedbackMail(username, feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    getAllProfile,
    getProfile,
    getAnythingInProfile,
    findProfileByName,
    getProfileById,
    updateProfile,
    sendMail,
    checkOTP,
    sendMailContribute,
    getOneProfile,
};
