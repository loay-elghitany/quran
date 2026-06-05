const mongoose = require("mongoose");

const { Schema } = mongoose;

const attendanceStatuses = ["Present", "Absent", "Excused"];
const evaluationTags = ["Excellent", "Good", "Needs Review", "Not Done"];

const AssignmentSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Student is required"],
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Teacher is required"],
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
  },
  attendanceStatus: {
    type: String,
    required: [true, "Attendance status is required"],
    enum: {
      values: attendanceStatuses,
      message: "Attendance status must be Present, Absent, or Excused",
    },
  },
  newMemorization: {
    startVerse: {
      type: Number,
      required: [true, "Start verse is required for new memorization"],
    },
    endVerse: {
      type: Number,
      required: [true, "End verse is required for new memorization"],
    },
    surahName: {
      type: String,
      required: [true, "Surah name is required for new memorization"],
      trim: true,
    },
  },
  reviewPast: {
    startVerse: {
      type: Number,
      required: [true, "Start verse is required for review"],
    },
    endVerse: {
      type: Number,
      required: [true, "End verse is required for review"],
    },
    surahName: {
      type: String,
      required: [true, "Surah name is required for review"],
      trim: true,
    },
  },
  evaluationTag: {
    type: String,
    required: [true, "Evaluation tag is required"],
    enum: {
      values: evaluationTags,
      message:
        "Evaluation tag must be Excellent, Good, Needs Review, or Not Done",
    },
  },
  teacherNote: {
    type: String,
    trim: true,
  },
  voiceNoteUrl: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
