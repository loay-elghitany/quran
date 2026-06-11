const Joi = require("joi");
const { objectIdSchema } = require("../../middlewares/validation.middleware");

const idParamsSchema = Joi.object({
  id: objectIdSchema,
});

const groupIdParamsSchema = Joi.object({
  groupId: objectIdSchema,
});

const studentUpdateSchema = Joi.object({
  teacherId: objectIdSchema.optional(),
  groupId: objectIdSchema.optional().allow(""),
  parentId: objectIdSchema.optional().allow(""),
});

module.exports = {
  idParamsSchema,
  groupIdParamsSchema,
  studentUpdateSchema,
};
