const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Tách token từ header
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY); // Xác thực token
            if (decoded?.user) {
                const user = await User.findById(decoded?.user?.id);
                req.user = { id: user?._id.toString(), role: user?.role };
            } else if (decoded.id) {
                const user = await User.findById(decoded.id);
                req.user = { id: user._id.toString(), role: user.role };
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Bạn chưa đăng nhập, vui lòng đăng nhập" });
        }
    } else {
        res.status(401).json({ message: "Token đã hết hạn, vui lòng đăng nhập lại" });
    }
};

const checkAdminMiddleware = (req, res, next) => {
    if (req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Bạn không có quyền truy cập", ok: false });
    }
};

// middleware/checkRole.js
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userRole = req.user.role;

        // SuperAdmin có thể access tất cả
        if (userRole === "superadmin") {
            return next();
        }

        // Kiểm tra role khác
        if (roles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    };
};

module.exports = { checkRole };

module.exports = { authMiddleware, checkAdminMiddleware };
