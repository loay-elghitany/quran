const Joi = require("joi");

const objectIdSchema = Joi.string()
  .pattern(/^[a-fA-F0-9]{24}$/)
  .required();

const ApiError = require("../utils/apiError");

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => detail.message);
    return next(
      new ApiError(
        "البيانات المرسلة غير صحيحة. يرجى التحقق من المعلومات وإعادة المحاولة.",
        400,
        details,
      ),
    );
  }

  req.body = value;
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => detail.message);
    return next(
      new ApiError(
        "البيانات المرسلة غير صحيحة. يرجى التحقق من المعلومات وإعادة المحاولة.",
        400,
        details,
      ),
    );
  }

  req.params = value;
  next();
};

module.exports = {
  validateBody,
  validateParams,
  objectIdSchema,
};
