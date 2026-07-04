const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const { getTopStudents } = require("../controllers/leaderboard.controller");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("SuperAdmin", "Teacher", "Student", "Parent"));

router.get("/students", getTopStudents);

module.exports = router;
