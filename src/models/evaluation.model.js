const mongoose = require("mongoose");

const { Schema } = mongoose;

const EvaluationSchema = new Schema({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Teacher reference is required"],
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Student reference is required"],
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: [true, "Group reference is required"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  attendance: {
    type: String,
    trim: true,
  },
  newMemorization: {
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  revision: {
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  mistakes: {
    type: Number,
    default: 0,
  },
  grade: {
    type: String,
    trim: true,
  },
  audioNote: {
    type: String,
    trim: true,
  },
  earnedPoints: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Evaluation", EvaluationSchema);
