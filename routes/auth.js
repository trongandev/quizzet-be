const express = require("express");
const { registerUser, loginUser, changePassword, logoutUser, updatePassword, forgotPassword } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", authMiddleware, logoutUser);
router.post("/change-password", authMiddleware, changePassword);
router.post("/update-password", authMiddleware, updatePassword);
router.post("/forgot-password", forgotPassword);

module.exports = router;
