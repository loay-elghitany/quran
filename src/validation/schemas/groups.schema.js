const Joi = require("joi");
const { objectIdSchema } = require("../../middlewares/validation.middleware");

const groupLessonParamsSchema = Joi.object({
  groupId: objectIdSchema,
});

module.exports = {
  groupLessonParamsSchema,
};
