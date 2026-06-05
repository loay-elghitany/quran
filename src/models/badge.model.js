const mongoose = require("mongoose");

const { Schema } = mongoose;

const BadgeSchema = new Schema({
  name: {
    type: String,
    required: [true, "Badge name is required"],
    trim: true,
  },
  icon: {
    type: String,
    trim: true,
    default: "🏆",
  },
  description: {
    type: String,
    trim: true,
  },
  pointsReward: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxPerMonth: {
    type: Number,
    default: 5,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model("Badge", BadgeSchema);
