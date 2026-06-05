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

    res.json({ leaderboard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الحصول على قائمة المتصدرين." });
  }
};

const getTopGroups = async (req, res) => {
  try {
    const leaderboard = await Evaluation.aggregate([
      {
        $group: {
          _id: "$groupId",
          totalPoints: { $sum: "$earnedPoints" },
          averagePoints: { $avg: "$earnedPoints" },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "groups",
          localField: "_id",
          foreignField: "_id",
          as: "group",
        },
      },
      { $unwind: "$group" },
      {
        $lookup: {
          from: "users",
          localField: "group.teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          groupId: "$_id",
          totalPoints: 1,
          averagePoints: 1,
          groupName: "$group.name",
          teacher: {
            firstName: "$teacher.firstName",
            lastName: "$teacher.lastName",
          },
        },
      },
    ]);

    res.json({ leaderboard });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "حدث خطأ في الحصول على قائمة أفضل الحلقات." });
  }
};

const User = require("../models/user.model");

const getTopTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "Teacher" })
      .select("firstName lastName points")
      .sort({ points: -1 })
      .limit(10)
      .lean();

    res.json({ leaderboard: teachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ في الحصول على قائمة المعلمين." });
  }
};

module.exports = {
  getTopStudents,
  getTopGroups,
  getTopTeachers,
};
