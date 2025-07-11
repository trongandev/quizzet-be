const express = require("express");
const { addSubOutline, getSubOutline, getSubOutlineBySlug, deleteSubOutline, updateSO, updateViewSO, getSubOutlineByUser, getSubOutlineAdmin } = require("../controllers/subjectOutlineController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/", getSubOutline);
router.get("/admin", getSubOutlineAdmin);
router.get("/user", authMiddleware, getSubOutlineByUser);
router.get("/:id", getSubOutlineBySlug);
router.post("/", authMiddleware, addSubOutline);
router.patch("/", authMiddleware, updateSO);
router.get("/view/:id", updateViewSO);
router.delete("/", authMiddleware, deleteSubOutline);

module.exports = router;
