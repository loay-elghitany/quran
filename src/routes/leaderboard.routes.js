const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  getTopStudents,
  getTopGroups,
  getTopTeachers,
} = require("../controllers/leaderboard.controller");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("SuperAdmin", "Teacher", "Student", "Parent"));

router.get("/students", getTopStudents);
router.get("/groups", getTopGroups);
router.get("/teachers", getTopTeachers);

module.exports = router;
