const Evaluation = require("../models/evaluation.model");

const getTopStudents = async (req, res) => {
  try {
    const leaderboard = await Evaluation.aggregate([
      {
        $group: {
          _id: "$studentId",
          totalPoints: { $sum: "$earnedPoints" },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          _id: 0,
          studentId: "$_id",
          totalPoints: 1,
          firstName: "$student.firstName",
          lastName: "$student.lastName",
        },
      },
    ]);

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

module.exports = {
  getTopStudents,
};
