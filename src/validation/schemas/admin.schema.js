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

const teacherUpdateSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().min(8).optional(),
});

const parentUpdateSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().min(8).optional(),
  childrenIds: Joi.array().items(objectIdSchema).optional(),
});

module.exports = {
  idParamsSchema,
  groupIdParamsSchema,
  studentUpdateSchema,
  teacherUpdateSchema,
  parentUpdateSchema,
};
