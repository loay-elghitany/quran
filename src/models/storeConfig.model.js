const mongoose = require("mongoose");

const { Schema } = mongoose;

const StoreConfigSchema = new Schema({
  name: {
    type: String,
    default: "Mystery Box",
    trim: true,
  },
  itemType: {
    type: String,
    enum: ["MysteryBox"],
    default: "MysteryBox",
  },
  cost: {
    type: Number,
    required: [true, "Cost is required"],
    min: 0,
  },
  description: {
    type: String,
    trim: true,
    default: "افتح صندوق الأسرار واكسب مفاجأة!",
  },
  possibleRewards: [
    {
      text: {
        type: String,
        required: true,
      },
      probability: {
        type: Number,
        default: 0.2,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  },
});

StoreConfigSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("StoreConfig", StoreConfigSchema);
