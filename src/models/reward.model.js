const mongoose = require("mongoose");

const { Schema } = mongoose;

const RewardSchema = new Schema({
  name: {
    type: String,
    required: [true, "Reward name is required"],
    trim: true,
  },
  pointsRequired: {
    type: Number,
    required: [true, "Points required is required"],
    min: 0,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0,
  },
  image: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Reward", RewardSchema);
