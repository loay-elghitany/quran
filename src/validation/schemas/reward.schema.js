const Joi = require("joi");

const rewardCreateSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  pointsRequired: Joi.number().integer().min(1).required(),
  imageUrl: Joi.string().uri().optional().allow(""),
  icon: Joi.string().trim().max(20).optional().allow(""),
  description: Joi.string().trim().max(500).optional().allow(""),
});

const rewardUpdateSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  pointsRequired: Joi.number().integer().min(1).optional(),
  imageUrl: Joi.string().uri().optional().allow(""),
  icon: Joi.string().trim().max(20).optional().allow(""),
  description: Joi.string().trim().max(500).optional().allow(""),
}).min(1);

const redemptionStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "approved", "rejected").required(),
});

module.exports = {
  rewardCreateSchema,
  rewardUpdateSchema,
  redemptionStatusSchema,
};
