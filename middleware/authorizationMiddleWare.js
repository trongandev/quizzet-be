const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Tách token từ header
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY); // Xác thực token
            if (decoded.user) {
                const user = await User.findById(decoded.user.id);

                req.user = { id: user._id.toString(), role: user.role };
            } else if (decoded.id) {
                const user = await User.findById(decoded.id);
                req.user = { id: user._id.toString(), role: user.role };
            }
            next();
        } catch (error) {
            console.log(error);
            res.status(401).json({ message: "Không tìm thấy token, vui lòng đăng nhập" });
        }
    } else {
        res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

const checkAdminMiddleware = (req, res, next) => {
    if (req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Bạn không có quyền truy cập", ok: false });
    }
};

module.exports = { authMiddleware, checkAdminMiddleware };
