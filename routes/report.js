const express = require("express");
const { GetAll, GetbyId, Create, Update } = require("../controllers/reportController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/", authMiddleware, checkAdminMiddleware, GetAll);
router.get("/:id", authMiddleware, checkAdminMiddleware, GetbyId);
router.post("/", authMiddleware, Create);
router.patch("/:_id", authMiddleware, checkAdminMiddleware, Update);

module.exports = router;
