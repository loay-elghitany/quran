const Joi = require("joi");
const { objectIdSchema } = require("../../middlewares/validation.middleware");

const assignmentCreateSchema = Joi.object({
  student: objectIdSchema,
  date: Joi.date().iso().required(),
  attendanceStatus: Joi.string()
    .valid("Present", "Absent", "Excused")
    .required(),
  newMemorization: Joi.object({
    startVerse: Joi.number().integer().min(1).required(),
    endVerse: Joi.number().integer().min(1).required(),
    surahName: Joi.string().trim().min(2).max(100).required(),
  }).required(),
  reviewPast: Joi.object({
    startVerse: Joi.number().integer().min(1).required(),
    endVerse: Joi.number().integer().min(1).required(),
    surahName: Joi.string().trim().min(2).max(100).required(),
  }).required(),
  evaluationTag: Joi.string()
    .valid("Excellent", "Good", "Needs Review", "Not Done")
    .required(),
  teacherNote: Joi.string().trim().max(1000).optional().allow(""),
  voiceNoteUrl: Joi.string().uri().optional().allow(""),
});

const evaluationCreateSchema = Joi.object({
  studentId: objectIdSchema,
  groupId: objectIdSchema,
  attendanceStatus: Joi.string()
    .valid("حاضر", "متأخر", "غائب", "غائب بعذر", "غائب بدون عذر")
    .required(),
  memorizationFrom: Joi.string().trim().max(100).optional().allow(""),
  memorizationTo: Joi.string().trim().max(100).optional().allow(""),
  revisionFrom: Joi.string().trim().max(100).optional().allow(""),
  revisionTo: Joi.string().trim().max(100).optional().allow(""),
  memorizationPagesCount: Joi.number().min(0).optional(),
  revisionPagesCount: Joi.number().min(0).optional(),
  mistakes: Joi.number().integer().min(0).optional(),
  grade: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(10),
      Joi.string().pattern(/^([1-9]|10)$/),
    )
    .required()
    .messages({
      "alternatives.match":
        "الدرجة يجب أن تكون رقماً من 1 إلى 10 أو نصاً يطابق 1-10",
    }),
  notes: Joi.string().trim().max(2000).optional().allow(""),
});

const awardBadgeParamsSchema = Joi.object({
  studentId: objectIdSchema,
});

const evaluationHistoryParamsSchema = Joi.object({
  studentId: objectIdSchema,
});

const leaveRequestStatusParamsSchema = Joi.object({
  id: objectIdSchema,
});

const groupLessonParamsSchema = Joi.object({
  groupId: objectIdSchema,
});

const curriculumParamsSchema = Joi.object({
  curriculumId: objectIdSchema,
});

const leaveRequestStatusSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected").required(),
});

const awardBadgeSchema = Joi.object({
  badgeId: objectIdSchema,
});

module.exports = {
  assignmentCreateSchema,
  evaluationCreateSchema,
  awardBadgeParamsSchema,
  evaluationHistoryParamsSchema,
  leaveRequestStatusParamsSchema,
  groupLessonParamsSchema,
  curriculumParamsSchema,
  leaveRequestStatusSchema,
  awardBadgeSchema,
};
