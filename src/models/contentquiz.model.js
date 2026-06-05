const mongoose = require("mongoose");

const { Schema } = mongoose;

const QuestionSchema = new Schema({
  questionText: {
    type: String,
    required: [true, "Question text is required"],
    trim: true,
  },
  options: [
    {
      type: String,
      required: [true, "Options are required"],
      trim: true,
    },
  ],
  correctAnswer: {
    type: String,
    required: [true, "Correct answer is required"],
    trim: true,
  },
});

const ContentQuizSchema = new Schema({
  videoTitle: {
    type: String,
    required: [true, "Video title is required"],
    trim: true,
  },
  youtubeUrl: {
    type: String,
    required: [true, "YouTube URL is required"],
    trim: true,
    match: [
      /^https:\/\/(www\.)?youtube\.com\/watch\?v=.+$/,
      "Please provide a valid YouTube URL",
    ],
  },
  questions: [QuestionSchema],
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model("ContentQuiz", ContentQuizSchema);
