const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Tách token từ header
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY); // Xác thực token
            const user = await User.findById(decoded.user.id);
            req.user = { id: decoded.user.id, role: user.role };
            next();
        } catch (error) {
            res.status(401).json({ message: "Xác thực không hợp lệ" });
        }
    } else {
        res.status(401).json({ message: "Bạn chưa đăng nhập" });
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
