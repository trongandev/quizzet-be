const express = require("express");
const { LoginUser, GetUser, GetHistory, CreateUser, UpdateUser, DeleteUser } = require("../controllers/ToolController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.post("/login", LoginUser);
//user
router.get("/user", authMiddleware, checkAdminMiddleware, GetUser);
router.post("/user", authMiddleware, checkAdminMiddleware, CreateUser);
router.patch("/user/:id", authMiddleware, checkAdminMiddleware, UpdateUser);
router.delete("/user", authMiddleware, checkAdminMiddleware, DeleteUser);

//history
router.get("/history", authMiddleware, checkAdminMiddleware, GetHistory);

module.exports = router;
