const express = require("express");
const multer = require("multer");
const {
  getTeacherDashboard,
  getTeacherStudentsWithEvaluations,
  getStudents,
  getBadges,
  awardBadge,
  createAssignment,
  createEvaluation,
  getEvaluationHistory,
  getLeaveRequests,
  updateLeaveRequestStatus,
} = require("../controllers/teacher.controller");
const { advanceGroupLesson } = require("../controllers/curriculum.controller");
const {
  getTeacherCurriculums,
  getCurrentForTeacher,
  completeLesson,
} = require("../controllers/teacherTraining.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  validateBody,
  validateParams,
} = require("../middlewares/validation.middleware");
const {
  assignmentCreateSchema,
  evaluationCreateSchema,
  awardBadgeParamsSchema,
  evaluationHistoryParamsSchema,
  leaveRequestStatusParamsSchema,
  groupLessonParamsSchema,
  curriculumParamsSchema,
  leaveRequestStatusSchema,
  awardBadgeSchema,
} = require("../validation/schemas/teacher.schema");
const { cloudinaryAudioStorage } = require("../config/cloudinary");

const upload = multer({
  storage: cloudinaryAudioStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid audio file type."));
    }
  },
});

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("Teacher"));

router.get("/dashboard", getTeacherDashboard);
router.get("/students-with-evaluations", getTeacherStudentsWithEvaluations);
router.get("/students", getStudents);
router.get("/badges", getBadges);
router.post(
  "/students/:studentId/award-badge",
  validateParams(awardBadgeParamsSchema),
  validateBody(awardBadgeSchema),
  awardBadge,
);
router.post(
  "/assignments",
  validateBody(assignmentCreateSchema),
  createAssignment,
);
router.post(
  "/evaluations",
  upload.single("audioNote"),
  validateBody(evaluationCreateSchema),
  createEvaluation,
);
router.get(
  "/evaluations/:studentId",
  validateParams(evaluationHistoryParamsSchema),
  getEvaluationHistory,
);
router.get("/leave-requests", getLeaveRequests);
router.put(
  "/leave-requests/:id/status",
  validateParams(leaveRequestStatusParamsSchema),
  validateBody(leaveRequestStatusSchema),
  updateLeaveRequestStatus,
);
router.post(
  "/groups/:groupId/advance-lesson",
  validateParams(groupLessonParamsSchema),
  advanceGroupLesson,
);
router.get("/training/curriculums", getTeacherCurriculums);
router.get(
  "/training/:curriculumId/current",
  validateParams(curriculumParamsSchema),
  getCurrentForTeacher,
);
router.post(
  "/training/:curriculumId/complete-lesson",
  validateParams(curriculumParamsSchema),
  completeLesson,
);

module.exports = router;
