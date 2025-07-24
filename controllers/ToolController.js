const { ToolHistoryModel, ToolUserModel } = require("../models/Tool");
const { SOModel } = require("../models/SO");
const comparePassword = async (inputPassword, userPassword) => {
    // So sánh mật khẩu người dùng với mật khẩu lưu trong cơ sở dữ liệu
    return inputPassword === userPassword;
};

const LoginUser = async (req, res) => {
    try {
        const { username, password, subject } = req.body;
        // Validate if both username and password are provided
        if (!username || !password) {
            // Lưu lịch sử đăng nhập thất bại khi thiếu thông tin
            await saveLoginHistory(username, password, req.headers, "Vui lòng điền đầy đủ thông tin", false, subject);
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        // Find the user by username
        let user = await ToolUserModel.findOne({ username });

        // If the user does not exist
        if (!user) {
            await saveLoginHistory(username, password, req.headers, "Người dùng không tồn tại", false, subject);
            return res.status(400).json({ message: "Người dùng không tồn tại" });
        }

        if (!user.status) {
            await saveLoginHistory(username, password, req.headers, "Tài khoản đã bị khoá", false, subject);
            return res.status(400).json({ message: "Tài khoản đã bị khoá" });
        }

        // Check if the user has exceeded login attempts and account is locked
        if (user.failed_login_attempts >= 5) {
            await saveLoginHistory(username, password, req.headers, "Tài khoản đã bị khoá, vui lòng liên hệ cho người bán", false, subject);
            return res.status(400).json({ message: "Tài khoản đã bị khoá, vui lòng liên hệ cho người bán" });
        }

        if (user.count_login <= 0) {
            await saveLoginHistory(username, password, req.headers, "Bạn đã hết số lần sử dụng tool", false, subject);
            return res.status(400).json({ message: "Bạn đã hết số lần sử dụng tool" });
        }

        // Validate password
        const isPasswordCorrect = await comparePassword(password, user.password);
        if (!isPasswordCorrect) {
            user.failed_login_attempts += 1;

            // If the failed attempts are now 5, lock the account
            if (user.failed_login_attempts >= 5) {
                user.status = false;
                await user.save();
                await saveLoginHistory(username, password, req.headers, "Tài khoản đã bị khoá do hết số lần thử đăng nhập, vui lòng liên hệ cho người bán", false, subject);
                return res.status(400).json({ message: "Tài khoản đã bị khoá do hết số lần thử đăng nhập, vui lòng liên hệ cho người bán" });
            }

            await user.save();
            await saveLoginHistory(username, password, req.headers, `Sai mật khẩu, bạn còn ${5 - user.failed_login_attempts} lần thử`, false, subject);
            return res.status(400).json({ message: `Sai mật khẩu, bạn còn ${5 - user.failed_login_attempts} lần thử` });
        }

        // Reset failed login attempts on successful login
        user.failed_login_attempts = 0;
        if (user.count_login <= 0) {
            user.count_login = 0;
        } else {
            user.count_login -= 1;
        }
        user.active_date = new Date();
        await user.save();

        const findSO = await SOModel.findOne({ slug: subject }).populate("quest", "data_so");
        if (!findSO) {
            await saveLoginHistory(username, password, req.headers, "Không tìm thấy môn này", false, subject);
            return res.status(400).json({ message: "Không tìm thấy môn này" });
        }
        // Return user information without sensitive data like password
        const { password: _, ...userInfo } = user.toObject();
        await saveLoginHistory(username, password, req.headers, "Đăng nhập thành công", true, subject);
        res.status(200).json({ message: "Đăng nhập thành công", ok: true, findSO });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Hàm để ghi lại lịch sử đăng nhập
const saveLoginHistory = async (username, password, header, message, status, subject) => {
    try {
        const newSO = new ToolHistoryModel({
            username,
            password,
            header,
            message,
            status,
            subject,
        });
        await newSO.save();
    } catch (error) {
        console.error("Error saving login history:", error);
    }
};

const GetUser = async (req, res) => {
    try {
        const find = await ToolUserModel.find().sort({ created_at: -1 });
        res.status(200).json(find);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const GetHistory = async (req, res) => {
    try {
        const find = await ToolHistoryModel.find().sort({ created_at: -1 });
        res.status(200).json(find);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const CreateUser = async (req, res) => {
    try {
        const { username, password, note } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
        }

        const newSO = new ToolUserModel({
            username,
            password,
            note,
        });

        await newSO.save();
        res.status(201).json({ message: "Thêm thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const UpdateUser = async (req, res) => {
    try {
        const { username, password, status, count_login, failed_login_attempts, note } = req.body; // Lấy id từ URL
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "ID không tồn tại", ok: false });
        }

        const updateFields = {}; // Tạo đối tượng rỗng để chứa các trường cần cập nhật

        if (username !== undefined) updateFields.username = username;
        if (password !== undefined) updateFields.password = password;
        if (status !== undefined) updateFields.status = status;
        if (count_login !== undefined) updateFields.count_login = count_login;
        if (note !== undefined) updateFields.note = note;
        if (failed_login_attempts !== undefined) updateFields.failed_login_attempts = failed_login_attempts;

        // Tìm và cập nhật quiz
        const updated = await ToolUserModel.findByIdAndUpdate(
            id,
            {
                $set: updateFields, // Chỉ cập nhật các trường được gửi trong request
            },
            { new: true } // Trả về quiz đã được cập nhật
        );

        if (!updated) {
            return res.status(404).json({ message: "Không tìm thấy user để cập nhật", ok: false });
        }

        res.status(200).json({ message: "Cập nhật thành công", ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const DeleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        await ToolUserModel.findByIdAndDelete(id);
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    LoginUser,
    GetUser,
    GetHistory,
    CreateUser,
    UpdateUser,
    DeleteUser,
};
