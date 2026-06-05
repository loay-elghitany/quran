const express = require("express");
const {
  getStudentDashboard,
  updateStudentAvatar,
  getStudentChallenges,
  getMyAssignments,
  getAssignmentRead,
  getQuizzes,
  submitQuiz,
} = require("../controllers/student.controller");
const {
  getStudentRewards,
  redeemReward,
} = require("../controllers/reward.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  validateBody,
  validateParams,
} = require("../middlewares/validation.middleware");
const {
  assignmentReadParamsSchema,
  quizSubmitParamsSchema,
  quizSubmitSchema,
  redeemRewardSchema,
  avatarUpdateSchema,
} = require("../validation/schemas/student.schema");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("Student"));

router.get("/dashboard", getStudentDashboard);
router.get("/challenges", getStudentChallenges);
router.get("/my-assignments", getMyAssignments);
router.get(
  "/my-assignments/:id/read",
  validateParams(assignmentReadParamsSchema),
  getAssignmentRead,
);
router.get("/quizzes", getQuizzes);
router.post(
  "/quizzes/:id/submit",
  validateParams(quizSubmitParamsSchema),
  validateBody(quizSubmitSchema),
  submitQuiz,
);
router.get("/rewards", getStudentRewards);
router.post("/redeem", validateBody(redeemRewardSchema), redeemReward);
router.patch("/avatar", validateBody(avatarUpdateSchema), updateStudentAvatar);

module.exports = router;
