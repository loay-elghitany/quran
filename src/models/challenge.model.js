const mongoose = require("mongoose");

const { Schema } = mongoose;

const ChallengeSchema = new Schema({
  title: {
    type: String,
    required: [true, "Challenge title is required"],
    trim: true,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: [true, "Challenge must belong to a group"],
  },
  targetPoints: {
    type: Number,
    required: [true, "Target points is required"],
    min: 1,
  },
  currentPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  rewardDescription: {
    type: String,
    trim: true,
  },
  deadline: {
    type: Date,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model("Challenge", ChallengeSchema);
