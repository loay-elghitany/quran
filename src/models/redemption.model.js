const mongoose = require("mongoose");

const { Schema } = mongoose;

const RedemptionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rewardId: {
    type: Schema.Types.ObjectId,
    ref: "Reward",
    required: true,
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Redemption", RedemptionSchema);
