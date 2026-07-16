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

module.exports = {
  getTopStudents,
};
