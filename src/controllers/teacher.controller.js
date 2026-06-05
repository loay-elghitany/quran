const Group = require("../models/group.model");
const Assignment = require("../models/assignment.model");
const Evaluation = require("../models/evaluation.model");
const Badge = require("../models/badge.model");
const LeaveRequest = require("../models/leaverequest.model");
const User = require("../models/user.model");
const notificationService = require("../services/notification.service");

const getStudents = async (req, res) => {
  try {
    const groups = await Group.find({ teacherId: req.user._id }).populate(
      "studentIds",
      "firstName lastName email phone role teacherId childrenIds",
    );
    const students = groups.flatMap((group) => group.studentIds);
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const getTeacherDashboard = async (req, res) => {
  try {
    const groups = await Group.find({ teacherId: req.user._id })
      .populate("teacherId", "firstName lastName")
      .populate("studentIds", "firstName lastName email phone role");

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const createAssignment = async (req, res) => {
  try {
    const {
      student,
      date,
      attendanceStatus,
      newMemorization,
      reviewPast,
      evaluationTag,
      teacherNote,
      voiceNoteUrl,
    } = req.body;

    const assignment = new Assignment({
      student,
      teacher: req.user._id,
      date,
      attendanceStatus,
      newMemorization,
      reviewPast,
      evaluationTag,
      teacherNote,
      voiceNoteUrl,
    });

    const savedAssignment = await assignment.save();

    // Notify parent
    const studentUser = await User.findById(student);
    const parentUser = await User.findOne({ childrenIds: student });
    if (parentUser && parentUser.phone) {
      const message = `New assignment for ${studentUser.firstName}: ${evaluationTag}`;
      notificationService.sendWhatsAppMessage(parentUser.phone, message);
    }

    res.status(201).json({
      message: "Assignment created successfully.",
      assignment: savedAssignment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const getLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      teacher: req.user._id,
      status: "Pending",
    }).populate("student parent");
    res.json({ leaveRequests });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const createEvaluation = async (req, res) => {
  try {
    const {
      studentId,
      groupId,
      attendanceStatus,
      memorizationFrom,
      memorizationTo,
      revisionFrom,
      revisionTo,
      mistakes,
      grade,
      notes,
    } = req.body;

    if (!studentId || !groupId) {
      return res.status(400).json({ message: "يجب تحديد الطالب والحلقة." });
    }

    let points = 0;
    if (attendanceStatus === "حاضر") points += 10;
    else if (attendanceStatus === "متأخر") points += 5;
    else if (attendanceStatus === "غائب") points -= 20;

    const gradeScores = {
      ممتاز: 50,
      "جيد جداً": 40,
      جيد: 20,
      "يحتاج مراجعة": 0,
    };
    points += gradeScores[grade] || 0;
    points -= (mistakes || 0) * 2;
    const earnedPoints = points;

    const evaluation = new Evaluation({
      teacherId: req.user._id,
      studentId,
      groupId,
      attendance: attendanceStatus,
      earnedPoints,
      newMemorization: {
        from: memorizationFrom,
        to: memorizationTo,
      },
      revision: {
        from: revisionFrom,
        to: revisionTo,
      },
      mistakes,
      grade,
      notes,
      audioNote: req.file ? `/uploads/audio/${req.file.filename}` : undefined,
    });

    const savedEvaluation = await evaluation.save();

    const student = await User.findById(studentId);
    if (student) {
      const previousStreak = student.evaluationStreak || {
        currentGrade: "",
        count: 0,
        maxStreak: 0,
      };
      let currentCount = 0;

      if (grade === "يحتاج مراجعة") {
        currentCount = 0;
      } else if (previousStreak.currentGrade === grade) {
        currentCount = previousStreak.count + 1;
      } else {
        currentCount = 1;
      }

      const nextMax = Math.max(previousStreak.maxStreak || 0, currentCount);
      student.evaluationStreak = {
        currentGrade: grade,
        count: currentCount,
        maxStreak: nextMax,
      };
      await student.save();
    }

    res.status(201).json({
      message: "تم حفظ التقييم بنجاح.",
      evaluation: savedEvaluation,
    });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ createdAt: -1 });
    res.json({ badges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الأوسمة." });
  }
};

const awardBadge = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({ message: "المعرف الخاص بالوسام مطلوب." });
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: "الوسام غير موجود." });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "الطالب غير موجود." });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyAwards = student.badges.filter(
      (award) =>
        award.badgeId.toString() === badgeId && award.awardedAt >= startOfMonth,
    ).length;

    if (badge.maxPerMonth && monthlyAwards >= badge.maxPerMonth) {
      return res.status(400).json({
        message: `تم منح هذا الوسام ${badge.maxPerMonth} مرات هذا الشهر بالفعل.`,
      });
    }

    student.badges.push({
      badgeId: badge._id,
      awardedBy: req.user._id,
      awardedAt: new Date(),
    });
    student.points = (student.points || 0) + (badge.pointsReward || 0);
    await student.save();

    res.json({
      message: "تم منح الوسام للطالب بنجاح.",
      badge,
      student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء منح الوسام." });
  }
};

const getEvaluationHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "يجب تحديد الطالب." });
    }

    const evaluations = await Evaluation.find({
      studentId,
      teacherId: req.user._id,
    })
      .sort({ date: -1 })
      .populate("groupId", "name");

    res.json({ evaluations });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في الخادم." });
  }
};

const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    res.json({
      message: "Leave request updated successfully.",
      leaveRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  getStudents,
  getTeacherDashboard,
  getBadges,
  awardBadge,
  createAssignment,
  createEvaluation,
  getEvaluationHistory,
  getLeaveRequests,
  updateLeaveRequestStatus,
};
