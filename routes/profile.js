const express = require("express");
const {
    getAllProfile,
    getProfile,
    findProfileByName,
    getProfileById,
    updateProfile,
    sendMail,
    checkOTP,
    sendMailContribute,
    getOneProfile,
    getAnythingInProfile,
} = require("../controllers/profileController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/admin", authMiddleware, checkAdminMiddleware, getAllProfile);
router.get("/sendmail", authMiddleware, sendMail);
router.post("/checkotp", authMiddleware, checkOTP);
router.get("/", authMiddleware, getProfile);
router.get("/anything", authMiddleware, getAnythingInProfile); // Lấy bất kỳ thông tin nào trong profile
router.get("/getoneprofile", authMiddleware, getOneProfile);
router.get("/findbyname/:text", authMiddleware, findProfileByName);
router.get("/:id", getProfileById);
router.patch("/", authMiddleware, updateProfile);
router.post("/feedback", sendMailContribute);

module.exports = router;
