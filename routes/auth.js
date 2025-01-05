const express = require("express");
const { registerUser, loginUser, forgetUser, changePassword, logoutUser } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forget", forgetUser);
router.get("/logout", logoutUser);
router.post("/change-password", authMiddleware, changePassword);

module.exports = router;
