const mongoose = require("mongoose");
const { Schema } = mongoose;

const LessonProgressSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  curriculumId: {
    type: Schema.Types.ObjectId,
    ref: "Curriculum",
    required: true,
  },
  lessonIndex: {
    type: Number,
    required: true,
  },
  watchPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  hasWatched: {
    type: Boolean,
    default: false,
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now,
  },
});

LessonProgressSchema.index(
  { studentId: 1, curriculumId: 1, lessonIndex: 1 },
  { unique: true },
);

module.exports = mongoose.model("LessonProgress", LessonProgressSchema);
