const express = require("express");
const { getCurrentLesson } = require("../controllers/curriculum.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateParams } = require("../middlewares/validation.middleware");
const {
  groupLessonParamsSchema,
} = require("../validation/schemas/groups.schema");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/:groupId/current-lesson",
  validateParams(groupLessonParamsSchema),
  getCurrentLesson,
);

module.exports = router;
