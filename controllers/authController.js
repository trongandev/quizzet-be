const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const HTML_TEMPLATE = require("../services/html-template");
const SENDMAIL = require("../services/mail");
const express = require("express");
const { OAuth2Client } = require("google-auth-library");

const registerUser = async (req, res) => {
    try {
        const { displayName, email, password } = req.body;
        if (!displayName || !email || !password) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Email không hợp lệ" });
        }
        let isEmail = await User.findOne({ email });
        if (isEmail) return res.status(400).json({ message: "Email đã được sử dụng" });

        if (password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải trên 6 kí tự" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            displayName,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email && !password) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Người dùng không tồn tại" });
        }

        if (!user.status) {
            return res.status(400).json({ message: "Tài khoản đã bị khoá, vui lòng liên hệ cho admin qua zalo: 0364080527" });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch || !user) {
            return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        res.status(200).json({ message: "Đăng nhập thành công", token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const logoutUser = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.status(200).json({ ok: true, message: "Đăng xuất thành công" });
};

const forgetUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Email không tồn tại" });
        }

        if (!user.status) {
            return res.status(400).json({ message: "Tài khoản đã bị khoá, vui lòng liên hệ cho admin qua zalo: 0364080527" });
        }

        const new_password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(new_password, 10);
        user.password = hashedPassword;
        await user.save();

        const options = {
            to: user.email, // receiver email
            subject: "Quên mật khẩu", // Subject line
            html: HTML_TEMPLATE(user.displayName, new_password, "Mật khẩu tạm thời", "Vui lòng đăng nhập để thay đổi mật khẩu mới"),
        };

        SENDMAIL(options, (info) => {
            console.log("Email sent successfully");
            console.log("MESSAGE ID: ", info.messageId);
        });

        res.status(200).json({ message: "Gửi thành công, vui lòng kiểm tra email của bạn" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const changePassword = async (req, res) => {
    const { old_password, new_password, re_new_password } = req.body;
    const { id } = req.user.user;
    if (!old_password || !new_password || !re_new_password) {
        return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
    }

    if (new_password !== re_new_password) {
        return res.status(400).json({ message: "Mật khẩu mới không trùng khớp" });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ message: "Mật khẩu phải trên 6 kí tự" });
    }

    let user = await User.findById(id);
    if (!user) {
        return res.status(400).json({ message: "Email không tồn tại" });
    }

    if (!user.status) {
        return res.status(400).json({ message: "Tài khoản đã bị khoá, vui lòng liên hệ cho admin qua zalo: 0364080527" });
    }

    const isMatch = await bcrypt.compare(old_password, user.password);

    //kiểm tra xem mật khẩu mới có trùng với mật khẩu hiện tại hay không
    const isMatchNew = await bcrypt.compare(new_password, user.password);
    if (isMatchNew) {
        return res.status(400).json({ message: "Mật khẩu mới không được trùng với mật khẩu cũ" });
    }

    if (!isMatch) {
        return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    forgetUser,
    changePassword,
};
