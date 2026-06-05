const express = require("express");
const { createQuiz, getQuizzes } = require("../controllers/content.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("SuperAdmin", "Teacher"));

router.post("/quizzes", createQuiz);
router.get("/quizzes", getQuizzes);

module.exports = router;
