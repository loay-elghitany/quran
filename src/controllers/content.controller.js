const ContentQuiz = require("../models/contentquiz.model");

const createQuiz = async (req, res) => {
  try {
    const { videoTitle, youtubeUrl, questions } = req.body;

    const quiz = new ContentQuiz({
      videoTitle,
      youtubeUrl,
      questions,
    });

    const savedQuiz = await quiz.save();
    res.status(201).json({
      message: "Quiz created successfully.",
      quiz: savedQuiz,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await ContentQuiz.find();
    res.json({ quizzes });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
};
