const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    description: { type: String },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    senderRole: { type: String },
    senderName: { type: String },
    senderEmail: { type: String },
    isAnonymous: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["Complaint", "Suggestion", "Technical_Issue", "Other"],
      default: "Complaint",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    status: {
      type: String,
      enum: ["Pending", "In_Progress", "Resolved", "Closed"],
      default: "Pending",
    },
    adminReply: { type: String },
    replies: [
      {
        sender: { type: String },
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
