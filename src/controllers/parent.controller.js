const User = require("../models/user.model");
const Group = require("../models/group.model");
const Evaluation = require("../models/evaluation.model");
const Assignment = require("../models/assignment.model");
const LeaveRequest = require("../models/leaverequest.model");

const getParentDashboard = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate({
      path: "childrenIds",
      select: "firstName lastName email phone role teacherId",
      populate: {
        path: "teacherId",
        select: "firstName lastName",
      },
    });

    if (!parent) {
      return res
        .status(404)
        .json({ success: false, message: "الوالد غير موجود." });
    }

    const children = await Promise.all(
      parent.childrenIds.map(async (child) => {
        const group = await Group.findOne({ studentIds: child._id }).populate(
          "teacherId",
          "firstName lastName",
        );
        const evaluations = await Evaluation.find({ studentId: child._id })
          .sort({ date: -1 })
          .populate("groupId", "name")
          .populate("teacherId", "firstName lastName");

        return {
          ...child.toObject(),
          group,
          evaluations,
        };
      }),
    );

    res.json({
      parent: {
        id: parent._id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone,
      },
      children,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getChildren = async (req, res, next) => {
  try {
    const children = await User.find({ _id: { $in: req.user.childrenIds } });
    res.json({ children });
  } catch (error) {
    next(error);
  }
};

const getChildAssignments = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (!req.user.childrenIds.map((id) => id.toString()).includes(studentId)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "ليس لديك صلاحية لعرض بيانات هذا الطفل.",
        });
    }

    const assignments = await Assignment.find({ student: studentId })
      .populate("teacher")
      .sort({ date: -1 });
    res.json({ assignments });
  } catch (error) {
    next(error);
  }
};

const createLeaveRequest = async (req, res, next) => {
  try {
    const { studentId, date, reason } = req.body;

    if (!req.user.childrenIds.map((id) => id.toString()).includes(studentId)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "ليس لديك صلاحية لتقديم طلب غياب لهذا الطفل.",
        });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "Student") {
      return res
        .status(400)
        .json({ success: false, message: "الطالب المحدد غير صالح." });
    }

    const leaveRequest = new LeaveRequest({
      student: studentId,
      parent: req.user._id,
      teacher: student.teacherId,
      date,
      reason,
    });

    const savedLeaveRequest = await leaveRequest.save();
    res
      .status(201)
      .json({
        message: "تم إرسال طلب الغياب بنجاح.",
        leaveRequest: savedLeaveRequest,
      });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getParentDashboard,
  getChildren,
  getChildAssignments,
  createLeaveRequest,
};
