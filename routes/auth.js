const express = require("express");
const { registerUser, loginUser, forgetUser, loginGoogle, refreshToken, changePassword } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", loginGoogle);
router.post("/google/refreshtoken", refreshToken);
router.post("/forget", forgetUser);
router.post("/change-password", authMiddleware, changePassword);

module.exports = router;
