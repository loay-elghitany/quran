const Joi = require("joi");

const mongoIdSchema = Joi.string().hex().length(24);

module.exports = {
  mongoIdSchema,
};
