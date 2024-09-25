const express = require("express");
const { addSubOutline, getSubOutline, getSubOutlineById, getSubOutlineBySlug, deleteSubOutline } = require("../controllers/adminController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/suboutline", getSubOutline);
router.get("/suboutline/:id", getSubOutlineById);
router.get("/so/:id", getSubOutlineBySlug);
router.post("/suboutline", authMiddleware, checkAdminMiddleware, addSubOutline);
router.delete("/suboutline", authMiddleware, checkAdminMiddleware, deleteSubOutline);

module.exports = router;
