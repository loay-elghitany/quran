const Group = require("../models/group.model");
const Assignment = require("../models/assignment.model");
const Evaluation = require("../models/evaluation.model");
const Badge = require("../models/badge.model");
const LeaveRequest = require("../models/leaverequest.model");
const User = require("../models/user.model");
const SystemSettings = require("../models/systemSettings.model");
const notificationService = require("../services/notification.service");

const getStudents = async (req, res, next) => {
  try {
    const groups = await Group.find({ teacherId: req.user._id }).populate(
      "studentIds",
      "firstName lastName email phone role teacherId childrenIds",
    );
    const students = groups.flatMap((group) => group.studentIds);
    res.json({ students });
  } catch (error) {
    next(error);
  }
};

const getTeacherDashboard = async (req, res) => {
  try {
    const groups = await Group.find({ teacherId: req.user._id })
      .populate("teacherId", "firstName lastName")
      .populate("studentIds", "firstName lastName email phone role");

    res.json({ groups });
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
  }
};

const getTeacherStudentsWithEvaluations = async (req, res) => {
  try {
    const groups = await Group.find({ teacherId: req.user._id }).populate(
      "studentIds",
      "firstName lastName email phone points",
    );

    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
        const students = await Promise.all(
          group.studentIds.map(async (student) => {
            const evaluations = await Evaluation.find({
              studentId: student._id,
            })
              .sort({ date: -1 })
              .select(
                "date attendance earnedPoints newMemorization revision mistakes grade notes audioNote groupId",
              )
              .populate("groupId", "name");

            return {
              ...student.toObject(),
              evaluations,
            };
          }),
        );

        return {
          _id: group._id,
          name: group.name,
          students,
        };
      }),
    );

    res.status(200).json({ success: true, groups: enrichedGroups });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

const createAssignment = async (req, res, next) => {
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
      message: "تم إنشاء التكليف بنجاح.",
      assignment: savedAssignment,
    });
  } catch (error) {
    next(error);
  }
};

const getLeaveRequests = async (req, res, next) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      teacher: req.user._id,
      status: "Pending",
    }).populate("student parent");
    res.json({ leaveRequests });
  } catch (error) {
    next(error);
  }
};

const createEvaluation = async (req, res, next) => {
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

    const memorizationPagesCount =
      parseFloat(
        req.body.memorizationPagesCount ||
          req.body.memorization_pages_count ||
          0,
      ) || 0;
    const revisionPagesCount =
      parseFloat(
        req.body.revisionPagesCount || req.body.revision_pages_count || 0,
      ) || 0;

    if (!studentId || !groupId) {
      return res.status(400).json({ message: "يجب تحديد الطالب والحلقة." });
    }

    // Fetch dynamic settings from database
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    const parsedGrade =
      grade !== undefined && grade !== null && String(grade).trim() !== ""
        ? Number(grade)
        : grade;
    const normalizedGrade =
      parsedGrade !== undefined && !Number.isNaN(parsedGrade)
        ? parsedGrade
        : grade;

    let points = 0;
    const isUnexcusedAbsence = attendanceStatus === "غائب بدون عذر";
    const isExcusedAbsence = attendanceStatus === "غائب بعذر";
    const isPresent = attendanceStatus === "حاضر";

    if (isUnexcusedAbsence) {
      // Unexcused absence: no earned points for the evaluation, student penalty applied later
      points = 0;
    } else if (isExcusedAbsence) {
      // Excused absence: evaluation yields 0 points
      points = 0;
    } else if (isPresent) {
      // New strict scoring rules
      const parsedMemPages = Number(memorizationPagesCount) || 0;
      const parsedRevPages = Number(revisionPagesCount) || 0;

      const gradeNum = Number(normalizedGrade);
      const gradePoints = !Number.isNaN(gradeNum) ? gradeNum * 3 : 0;

      const attendancePoints = 20;

      const memBonus =
        (settings.memorizationPageBonus !== undefined
          ? Number(settings.memorizationPageBonus)
          : 10) * parsedMemPages;

      const revBonus =
        (settings.revisionPageBonus !== undefined
          ? Number(settings.revisionPageBonus)
          : 5) * parsedRevPages;

      const mistakesPenalty = Number(mistakes || 0) * 1;

      points =
        gradePoints + attendancePoints + memBonus + revBonus - mistakesPenalty;
    }

    const earnedPoints = Math.max(0, Math.round(points));

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
      memorizationPagesCount: Number(memorizationPagesCount) || 0,
      revisionPagesCount: Number(revisionPagesCount) || 0,
      mistakes,
      grade: isPresent ? normalizedGrade : undefined,
      notes,
      audioNote: req.file?.path || undefined,
    });

    const savedEvaluation = await evaluation.save();

    if (isUnexcusedAbsence) {
      await User.findByIdAndUpdate(studentId, {
        $inc: { points: -15 },
      });
    }

    if (isPresent) {
      await User.findByIdAndUpdate(studentId, {
        $inc: { points: earnedPoints },
      });

      const student = await User.findById(studentId);
      if (student) {
        const previousStreak = student.evaluationStreak || {
          currentGrade: "",
          count: 0,
          maxStreak: 0,
        };
        const currentCount =
          grade === "يحتاج مراجعة"
            ? 0
            : previousStreak.currentGrade === grade
              ? previousStreak.count + 1
              : 1;

        student.evaluationStreak = {
          currentGrade: grade,
          count: currentCount,
          maxStreak: Math.max(previousStreak.maxStreak || 0, currentCount),
        };
        await student.save();
      }
    }

    res.status(201).json({
      message: "تم حفظ التقييم بنجاح.",
      evaluation: savedEvaluation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
  }
};

const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ createdAt: -1 });
    res.json({ badges });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
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
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
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
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
  }
};

const deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: "التقييم غير موجود." });
    }

    // Ensure the requesting teacher created this evaluation
    if (
      evaluation.teacherId &&
      evaluation.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "غير مصرح بحذف هذا التقييم." });
    }

    const student = await User.findById(evaluation.studentId);
    if (student) {
      if (evaluation.attendance === "غائب بدون عذر") {
        student.points = (student.points || 0) + 15;
      } else if (evaluation.attendance === "حاضر") {
        student.points = (student.points || 0) - (evaluation.earnedPoints || 0);
      }

      await student.save();
    }

    await evaluation.deleteOne();

    res.json({ message: "تم حذف التقييم وتحديث رصيد نقاط الطالب بنجاح." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً." });
  }
};

const updateLeaveRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "عذراً، الحالة المختارة غير صحيحة.",
      });
    }

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "عذراً، طلب الإجازة غير موجود.",
      });
    }

    res.json({
      message: "تم تحديث طلب الإجازة بنجاح.",
      leaveRequest,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getTeacherDashboard,
  getTeacherStudentsWithEvaluations,
  getBadges,
  awardBadge,
  createAssignment,
  createEvaluation,
  deleteEvaluation,
  getEvaluationHistory,
  getLeaveRequests,
  updateLeaveRequestStatus,
};
