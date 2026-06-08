const ContentQuiz = require("../models/contentquiz.model");

const createQuiz = async (req, res, next) => {
  try {
    const { videoTitle, youtubeUrl, questions } = req.body;

    const quiz = new ContentQuiz({
      videoTitle,
      youtubeUrl,
      questions,
    });

    const savedQuiz = await quiz.save();
    res.status(201).json({
      message: "تم إنشاء الاختبار بنجاح.",
      quiz: savedQuiz,
    });
  } catch (error) {
    next(error);
  }
};

const getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await ContentQuiz.find();
    res.json({ quizzes });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
};
