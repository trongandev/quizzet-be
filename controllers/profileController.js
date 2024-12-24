const User = require("../models/User");
const { QuizModel, DataQuizModel } = require("../models/Quiz");
const HTML_TEMPLATE = require("../services/html-template");
const SENDMAIL = require("../services/mail");
const getAllProfile = async (req, res) => {
    try {
        const user = await User.find().sort({ created_at: -1 }).select("-password").populate("displayName profilePicture");
        res.status(200).json({ user, ok: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id).select("-password").populate("displayName profilePicture");
        const quiz = await QuizModel.find({ uid: id }).sort({ date: -1 });
        if (!user) {
            return res.status(404).json({ msg: "Người dùng không tìm thấy" });
        }
        res.status(200).json({ user, quiz });
    } catch (error) {
        console.log(error);
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
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getProfileById = async (req, res) => {
    try {
        const uid = req.params.uid;
        if (!uid) {
            return res.status(400).json({ msg: "Thiếu userId trong tham số" });
        }
        const user = await User.findById(uid).select("-password").populate("displayName profilePicture");
        const quiz = await QuizModel.find({ uid: uid, status: true }).sort({ date: -1 });
        if (!user) {
            return res.status(404).json({ msg: "Người dùng không tìm thấy" });
        }
        res.status(200).json({ user, quiz });
    } catch (error) {
        console.log(error);
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
        return res.status(200).json({ message: "Cập nhật thành công", update_profile });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const sendMail = async (req, res) => {
    try {
        const { id } = req.user;
        if (!id) {
            return res.status(400).json({ msg: "Thiếu userId trong tham số" });
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: "Người dùng không tìm thấy" });
        }

        if (user.verify) {
            return res.status(400).json({ message: "Tài khoản đã được xác thực" });
        }

        //create random otp code
        const otp = Math.floor(100000 + Math.random() * 900000);
        //thời hạn 10 phút
        user.expire_otp = Date.now() + 1000 * 60 * 10;
        user.otp = otp;
        await user.save();

        const options = {
            to: user.email, // receiver email
            subject: "Xác nhận mã OTP trên hệ thống trongan.site", // Subject line
            html: HTML_TEMPLATE(user.displayName, user.otp, "Mã OTP", "Mã OTP chỉ có hiệu lực trong 10 phút"),
        };

        SENDMAIL(options, (info) => {
            console.log("Email sent successfully");
            console.log("MESSAGE ID: ", info.messageId);
        });

        res.status(200).json({ message: "Gửi mail thành công", ok: true });
    } catch (error) {
        console.log(error);
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
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    getAllProfile,
    getProfile,
    findProfileByName,
    getProfileById,
    updateProfile,
    sendMail,
    checkOTP,
};
