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
    type: { type: String, default: "Complaint" },
    priority: { type: String, default: "Low" },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
