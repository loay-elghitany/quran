const User = require("../models/user.model");
const Group = require("../models/group.model");
const Evaluation = require("../models/evaluation.model");
const Redemption = require("../models/redemption.model");
const Challenge = require("../models/challenge.model");
const Assignment = require("../models/assignment.model");
const ContentQuiz = require("../models/contentquiz.model");
const { fetchVerses } = require("../services/quran.service");

const getStudentDashboard = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select(
        "firstName lastName email phone role teacherId avatar points badges evaluationStreak",
      )
      .populate("teacherId", "firstName lastName email phone")
      .populate({
        path: "badges.badgeId",
        select: "name icon description pointsReward",
      });

    if (!student) {
      return res.status(404).json({ message: "الطالب غير موجود." });
    }

    const group = await Group.findOne({ studentIds: student._id }).populate(
      "teacherId",
      "firstName lastName",
    );

    const evaluations = await Evaluation.find({ studentId: student._id })
      .sort({ date: -1 })
      .populate("groupId", "name")
      .populate("teacherId", "firstName lastName");

    const evaluationAggregation = await Evaluation.aggregate([
      { $match: { studentId: student._id } },
      { $group: { _id: null, totalPoints: { $sum: "$earnedPoints" } } },
    ]);
    const evaluationPoints = evaluationAggregation[0]?.totalPoints || 0;
    const badgePoints = student.points || 0;
    const totalPoints = evaluationPoints + badgePoints;

    const reservedAggregation = await Redemption.aggregate([
      {
        $match: {
          studentId: student._id,
          status: { $in: ["pending", "approved"] },
        },
      },
      {
        $group: {
          _id: null,
          reservedPoints: { $sum: "$pointsRequired" },
        },
      },
    ]);
    const reservedPoints = reservedAggregation[0]?.reservedPoints || 0;
    const availablePoints = totalPoints - reservedPoints;

    res.json({
      student,
      teacher: student.teacherId,
      group,
      evaluations,
      points: {
        totalPoints,
        availablePoints,
        reservedPoints,
        badgePoints,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const updateStudentAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== "string") {
      return res.status(400).json({ message: "يرجى اختيار صورة رمزية صحيحة." });
    }

    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "الطالب غير موجود." });
    }

    const lockedAvatarThresholds = {
      "https://api.dicebear.com/6.x/pixel-art/svg?seed=Crown": 500,
      "https://api.dicebear.com/6.x/pixel-art/svg?seed=Dragon": 500,
    };

    const requiredPoints = lockedAvatarThresholds[avatar] || 0;
    if (student.points < requiredPoints) {
      return res.status(403).json({
        message: `هذا الآفاتار خاص، ويُفتح عندما تصل إلى ${requiredPoints} نقطة.`,
      });
    }

    student.avatar = avatar;
    await student.save();
    res.json({
      message: "تم تحديث الصورة الرمزية بنجاح.",
      avatar: student.avatar,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث الصورة الرمزية." });
  }
};

const getStudentChallenges = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("points");
    if (!student) {
      return res.status(404).json({ message: "الطالب غير موجود." });
    }

    const group = await Group.findOne({ studentIds: student._id });
    if (!group) {
      return res.json({ challenges: [], totalPoints: 0 });
    }

    const evaluationAggregation = await Evaluation.aggregate([
      { $match: { studentId: student._id } },
      { $group: { _id: null, totalPoints: { $sum: "$earnedPoints" } } },
    ]);
    const evaluationPoints = evaluationAggregation[0]?.totalPoints || 0;
    const totalPoints = evaluationPoints + (student.points || 0);

    const challenges = await Challenge.find({ groupId: group._id }).sort({
      deadline: 1,
    });

    const mappedChallenges = challenges.map((challenge) => ({
      ...challenge.toObject(),
      progress: Math.min(
        100,
        Math.round((totalPoints / challenge.targetPoints) * 100),
      ),
      isCompleted: totalPoints >= challenge.targetPoints,
    }));

    res.json({ challenges: mappedChallenges, totalPoints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب تحديات المجموعة." });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ student: req.user._id })
      .populate("teacher")
      .sort({ date: -1 });
    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const getAssignmentRead = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id).populate("teacher");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (assignment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    const newMemorizationVerses = fetchVerses(
      assignment.newMemorization.surahName,
      assignment.newMemorization.startVerse,
      assignment.newMemorization.endVerse,
    );

    const reviewPastVerses = fetchVerses(
      assignment.reviewPast.surahName,
      assignment.reviewPast.startVerse,
      assignment.reviewPast.endVerse,
    );

    const assignmentWithVerses = assignment.toObject();
    assignmentWithVerses.newMemorization.verses = newMemorizationVerses;
    assignmentWithVerses.reviewPast.verses = reviewPastVerses;

    res.json({ assignment: assignmentWithVerses });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await ContentQuiz.find();

    const sanitizedQuizzes = quizzes.map((quiz) => {
      const quizObj = quiz.toObject();
      quizObj.questions = quizObj.questions.map((q) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
      return quizObj;
    });

    res.json({ quizzes: sanitizedQuizzes });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const quiz = await ContentQuiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    let score = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (answers[i] === quiz.questions[i].correctAnswer) {
        score += 1;
      }
    }

    res.json({
      message: "Quiz submitted successfully.",
      score,
      totalQuestions: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  getStudentDashboard,
  updateStudentAvatar,
  getStudentChallenges,
  getMyAssignments,
  getAssignmentRead,
  getQuizzes,
  submitQuiz,
};
