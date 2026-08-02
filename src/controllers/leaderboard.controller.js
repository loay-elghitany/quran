const Group = require("../models/group.model");
const User = require("../models/user.model");

const getTopStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "Student" })
      .select("firstName lastName points avatar")
      .sort({ points: -1 })
      .limit(10)
      .lean();

    const leaderboard = students.map((student) => ({
      studentId: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      totalPoints: student.points || 0,
      avatar: student.avatar || "",
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const getGroupsLeaderboard = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("teacherId", "firstName lastName")
      .populate("studentIds", "firstName lastName points avatar")
      .lean();

    const groupsLeaderboard = groups.map((group) => {
      const sortedStudents = (group.studentIds || [])
        .map((student) => ({
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          points: student.points || 0,
          avatar: student.avatar || "",
        }))
        .sort((a, b) => b.points - a.points);

      const totalGroupPoints = sortedStudents.reduce(
        (sum, student) => sum + student.points,
        0,
      );

      return {
        groupId: group._id,
        groupName: group.name,
        teacherName: group.teacherId
          ? `${group.teacherId.firstName || ""} ${group.teacherId.lastName || ""}`.trim()
          : "غير محدد",
        totalGroupPoints,
        studentsCount: sortedStudents.length,
        students: sortedStudents,
      };
    });

    groupsLeaderboard.sort((a, b) => b.totalGroupPoints - a.totalGroupPoints);

    res.json({ success: true, groupsLeaderboard });
  } catch (error) {
    console.error("Failed to fetch groups leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

module.exports = {
  getTopStudents,
  getGroupsLeaderboard,
};
