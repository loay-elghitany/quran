const express = require("express");
const multer = require("multer");
const {
  createUser,
  createGroup,
  updateGroup,
  updateStudent,
  getUsers,
  getGroups,
} = require("../controllers/superadmin.controller");
const {
  createAnnouncement,
} = require("../controllers/announcement.controller");
const {
  createReward,
  getRewards,
  updateReward,
  deleteReward,
  getRedemptions,
  updateRedemptionStatus,
} = require("../controllers/reward.controller");
const {
  createCurriculum,
  getCurriculums,
  getCurriculumById,
  updateCurriculum,
  deleteCurriculum,
  uploadLessonPdf,
  assignCurriculumToGroup,
} = require("../controllers/curriculum.controller");
const {
  createBadge,
  getBadges,
  updateBadge,
  deleteBadge,
  createChallenge,
  getChallenges,
  getChallengesByGroup,
  updateChallenge,
  deleteChallenge,
  getOrCreateMysteryBoxConfig,
  updateMysteryBoxConfig,
} = require("../controllers/gamification.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  validateBody,
  validateParams,
} = require("../middlewares/validation.middleware");
const {
  badgeCreateSchema,
  badgeUpdateSchema,
  challengeCreateSchema,
  challengeUpdateSchema,
  mysteryBoxConfigSchema,
} = require("../validation/schemas/gamification.schema");
const {
  rewardCreateSchema,
  rewardUpdateSchema,
  redemptionStatusSchema,
} = require("../validation/schemas/reward.schema");
const {
  idParamsSchema,
  groupIdParamsSchema,
  studentUpdateSchema,
} = require("../validation/schemas/admin.schema");
const { cloudinaryPdfStorage } = require("../config/cloudinary");

const pdfUpload = multer({
  storage: cloudinaryPdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Invalid PDF file type."));
    }
  },
});

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("SuperAdmin"));

router.get("/users", getUsers);
router.get("/groups", getGroups);
router.post("/users", createUser);
router.post("/groups", createGroup);
router.put(
  "/groups/:groupId",
  validateParams(groupIdParamsSchema),
  updateGroup,
);
router.put(
  "/users/students/:id",
  validateParams(idParamsSchema),
  validateBody(studentUpdateSchema),
  updateStudent,
);
router.post("/announcements", createAnnouncement);
router.post("/rewards", validateBody(rewardCreateSchema), createReward);
router.get("/rewards", getRewards);
router.put(
  "/rewards/:id",
  validateParams(idParamsSchema),
  validateBody(rewardUpdateSchema),
  updateReward,
);
router.delete("/rewards/:id", validateParams(idParamsSchema), deleteReward);
router.get("/redemptions", getRedemptions);
router.put(
  "/redemptions/:id",
  validateParams(idParamsSchema),
  validateBody(redemptionStatusSchema),
  updateRedemptionStatus,
);

router.post("/curriculums", createCurriculum);
router.get("/curriculums", getCurriculums);
router.get(
  "/curriculums/:id",
  validateParams(idParamsSchema),
  getCurriculumById,
);
router.put(
  "/curriculums/:id",
  validateParams(idParamsSchema),
  updateCurriculum,
);
router.delete(
  "/curriculums/:id",
  validateParams(idParamsSchema),
  deleteCurriculum,
);
router.post(
  "/curriculums/upload-pdf",
  pdfUpload.single("pdf"),
  uploadLessonPdf,
);
router.put(
  "/groups/:groupId/assign-curriculum",
  validateParams(groupIdParamsSchema),
  assignCurriculumToGroup,
);

// Gamification Routes
router.post("/badges", validateBody(badgeCreateSchema), createBadge);
router.get("/badges", getBadges);
router.put(
  "/badges/:id",
  validateParams(idParamsSchema),
  validateBody(badgeUpdateSchema),
  updateBadge,
);
router.delete("/badges/:id", validateParams(idParamsSchema), deleteBadge);

router.post(
  "/challenges",
  validateBody(challengeCreateSchema),
  createChallenge,
);
router.get("/challenges", getChallenges);
router.get(
  "/challenges/group/:groupId",
  validateParams(groupIdParamsSchema),
  getChallengesByGroup,
);
router.put(
  "/challenges/:id",
  validateParams(idParamsSchema),
  validateBody(challengeUpdateSchema),
  updateChallenge,
);
router.delete(
  "/challenges/:id",
  validateParams(idParamsSchema),
  deleteChallenge,
);

router.get("/mystery-box", getOrCreateMysteryBoxConfig);
router.put(
  "/mystery-box",
  validateBody(mysteryBoxConfigSchema),
  updateMysteryBoxConfig,
);

module.exports = router;
