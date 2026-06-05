const Joi = require("joi");

const badgeCreateSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  icon: Joi.string().trim().max(10).optional().allow(""),
  description: Joi.string().trim().max(500).optional().allow(""),
  pointsReward: Joi.number().integer().min(0).required(),
  maxPerMonth: Joi.number().integer().min(0).optional(),
});

const badgeUpdateSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  icon: Joi.string().trim().max(10).optional().allow(""),
  description: Joi.string().trim().max(500).optional().allow(""),
  pointsReward: Joi.number().integer().min(0).optional(),
  maxPerMonth: Joi.number().integer().min(0).optional(),
}).min(1);

const challengeCreateSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required(),
  groupId: Joi.string().trim().required(),
  targetPoints: Joi.number().integer().min(1).required(),
  rewardDescription: Joi.string().trim().max(500).optional().allow(""),
  deadline: Joi.date().iso().optional().allow(null, ""),
});

const challengeUpdateSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).optional(),
  targetPoints: Joi.number().integer().min(1).optional(),
  currentPoints: Joi.number().integer().min(0).optional(),
  rewardDescription: Joi.string().trim().max(500).optional().allow(""),
  deadline: Joi.date().iso().optional().allow(null, ""),
  isCompleted: Joi.boolean().optional(),
}).min(1);

const rewardItemSchema = Joi.object({
  text: Joi.string().trim().min(1).max(200).required(),
  probability: Joi.number().min(0).max(1).required(),
});

const mysteryBoxConfigSchema = Joi.object({
  cost: Joi.number().integer().min(0).optional(),
  description: Joi.string().trim().max(1000).optional().allow(""),
  possibleRewards: Joi.array().items(rewardItemSchema).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  badgeCreateSchema,
  badgeUpdateSchema,
  challengeCreateSchema,
  challengeUpdateSchema,
  mysteryBoxConfigSchema,
};
