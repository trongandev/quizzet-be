const express = require("express");
const { getAllProfile, getProfile, getProfileById, updateProfile, sendMail, checkOTP } = require("../controllers/profileController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/admin", authMiddleware, checkAdminMiddleware, getAllProfile);
router.get("/sendmail", authMiddleware, sendMail);
router.post("/checkotp", authMiddleware, checkOTP);
router.get("/", authMiddleware, getProfile);
router.get("/:uid", getProfileById);
router.patch("/", authMiddleware, updateProfile);

module.exports = router;
