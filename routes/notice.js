const express = require("express");
const { Get, Create, Update, GetPublic, Delete } = require("../controllers/NoticeController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/", Get);
router.get("/public", GetPublic);
router.post("/", authMiddleware, checkAdminMiddleware, Create);
router.patch("/:id", authMiddleware, checkAdminMiddleware, Update);
router.delete("/", authMiddleware, checkAdminMiddleware, Delete);

// router.get("/suboutline/:id", getSubOutlineById);
// router.get("/so/:id", getSubOutlineBySlug);
// router.post("/suboutline", authMiddleware, checkAdminMiddleware, addSubOutline);
// router.get("/suboutline/view/:id", updateViewSO);

module.exports = router;
