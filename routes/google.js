const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();
router.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"], failureRedirect: "/login/failure" }));

router.get(
    "/api/auth/google/callback",
    (req, res, next) => {
        next();
    },
    passport.authenticate("google", {
        failureRedirect: "/login/failure",
        session: false,
    }),
    (req, res) => {
        // Tạo token như bình thường
        const token = jwt.sign({ id: req.user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });

        // Sử dụng CLIENT_URL từ environment variable
        const clientUrl = process.env.CLIENT_URL;

        res.redirect(`${clientUrl}?token=${token}`);
    }
);

// Thêm route xử lý khi login thất bại
router.use("/login/failure", (req, res) => {
    res.status(401).json({
        message: "Google Authentication Failed",
        error: "Unable to authenticate with Google",
    });
});

module.exports = router;
