const mongoose = require("mongoose");

const { Schema } = mongoose;

const LessonSchema = new Schema({
  title: {
    type: String,
    required: [true, "Lesson title is required"],
    trim: true,
  },
  task: {
    type: String,
    trim: true,
  },
  pdfUrl: {
    type: String,
    trim: true,
  },
  videoUrl: {
    type: String,
    trim: true,
  },
});

const CurriculumSchema = new Schema({
  name: {
    type: String,
    required: [true, "Curriculum name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  target: {
    type: String,
    enum: ["student", "teacher"],
    default: "student",
  },
  lessons: {
    type: [LessonSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model("Curriculum", CurriculumSchema);
