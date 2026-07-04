const Joi = require("joi");
const { objectIdSchema } = require("../../middlewares/validation.middleware");

const idParamsSchema = Joi.object({
  id: objectIdSchema,
});

const groupIdParamsSchema = Joi.object({
  groupId: objectIdSchema,
});

const studentUpdateSchema = Joi.object({
  firstName: Joi.string().allow("").optional(),
  lastName: Joi.string().allow("").optional(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  password: Joi.string().min(8).allow("").optional(),
  teacherId: objectIdSchema.optional(),
  groupId: objectIdSchema.optional().allow(""),
  parentId: objectIdSchema.optional().allow(""),
});

const teacherUpdateSchema = Joi.object({
  firstName: Joi.string().allow("").optional(),
  lastName: Joi.string().allow("").optional(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  password: Joi.string().min(8).allow("").optional(),
});

const parentUpdateSchema = Joi.object({
  firstName: Joi.string().allow("").optional(),
  lastName: Joi.string().allow("").optional(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  password: Joi.string().min(8).allow("").optional(),
  childrenIds: Joi.array().items(objectIdSchema).optional(),
});

module.exports = {
  idParamsSchema,
  groupIdParamsSchema,
  studentUpdateSchema,
  teacherUpdateSchema,
  parentUpdateSchema,
};
