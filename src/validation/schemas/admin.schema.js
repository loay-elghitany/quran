const Joi = require("joi");
const { objectIdSchema } = require("../../middlewares/validation.middleware");

const idParamsSchema = Joi.object({
  id: objectIdSchema,
});

const groupIdParamsSchema = Joi.object({
  groupId: objectIdSchema,
});

module.exports = {
  idParamsSchema,
  groupIdParamsSchema,
};
