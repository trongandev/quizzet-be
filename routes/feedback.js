const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const { Create, Get, Delete, Update } = require("../controllers/feedbackController");
const router = express.Router();

router.get("/", Get);
router.post("/", authMiddleware, Create);
router.patch("/:_id", authMiddleware, Update);
router.delete("/:_id", authMiddleware, Delete);

module.exports = router;
