const express = require("express");
const { getAllProfile, getProfile, findProfileByName, getProfileById, updateProfile, sendMail, checkOTP } = require("../controllers/profileController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/admin", authMiddleware, checkAdminMiddleware, getAllProfile);
router.get("/sendmail", authMiddleware, sendMail);
router.post("/checkotp", authMiddleware, checkOTP);
router.get("/", authMiddleware, getProfile);
router.get("/findbyname/:text", authMiddleware, findProfileByName);
router.get("/:uid", getProfileById);
router.patch("/", authMiddleware, updateProfile);

module.exports = router;
