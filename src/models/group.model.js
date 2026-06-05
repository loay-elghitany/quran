const mongoose = require("mongoose");

const { Schema } = mongoose;

const GroupSchema = new Schema({
  name: {
    type: String,
    required: [true, "Group name is required"],
    trim: true,
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Group must have an assigned teacher"],
  },
  studentIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  description: {
    type: String,
    trim: true,
  },
  grade: {
    type: String,
    trim: true,
  },
  curriculumId: {
    type: Schema.Types.ObjectId,
    ref: "Curriculum",
    default: null,
  },
  currentLessonIndex: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

GroupSchema.path("studentIds").validate(function (value) {
  return Array.isArray(value) && value.length > 0;
}, "Group must include at least one student.");

module.exports = mongoose.model("Group", GroupSchema);
