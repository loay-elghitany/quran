const mongoose = require("mongoose");
const { Schema } = mongoose;

const TeacherProgressSchema = new Schema({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  curriculumId: {
    type: Schema.Types.ObjectId,
    ref: "Curriculum",
    required: true,
  },
  currentLessonIndex: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model("TeacherProgress", TeacherProgressSchema);
