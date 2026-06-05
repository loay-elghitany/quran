const mongoose = require("mongoose");

const { Schema } = mongoose;

const statuses = ["Pending", "Approved", "Rejected"];

const LeaveRequestSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Student is required"],
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Parent is required"],
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Teacher is required"],
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
  },
  reason: {
    type: String,
    required: [true, "Reason is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: {
      values: statuses,
      message: "Status must be Pending, Approved, or Rejected",
    },
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model("LeaveRequest", LeaveRequestSchema);
