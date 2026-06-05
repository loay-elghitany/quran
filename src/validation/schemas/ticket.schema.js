const Joi = require("joi");

const ticketCreateSchema = Joi.object({
  subject: Joi.string().trim().min(5).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  senderName: Joi.string().trim().max(100).optional().allow(""),
  senderEmail: Joi.string().email().optional().allow(""),
  isAnonymous: Joi.boolean().optional(),
  type: Joi.string()
    .valid("Complaint", "Feedback", "Request", "Other")
    .optional(),
  priority: Joi.string().valid("Low", "Medium", "High").optional(),
});

const ticketUpdateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "Open", "In Progress", "Resolved", "Closed")
    .required(),
});

module.exports = {
  ticketCreateSchema,
  ticketUpdateStatusSchema,
};
