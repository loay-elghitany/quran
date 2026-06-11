const User = require("../models/user.model");
const Group = require("../models/group.model");

const createUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      teacherId,
      childrenIds,
    } = req.body;

    if (!["Teacher", "Student", "Parent"].includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "الدور المحدد غير صالح. يجب أن يكون الدور 'Teacher' أو 'Student' أو 'Parent'.",
      });
    }

    if (role === "Student" && !teacherId) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد معلم للطالب.",
      });
    }

    if (
      role === "Parent" &&
      (!Array.isArray(childrenIds) || childrenIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "يجب أن يتضمن الوالد معرف طفل واحد على الأقل.",
      });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      teacherId: role === "Student" ? teacherId : undefined,
      childrenIds: role === "Parent" ? childrenIds : undefined,
    });

    const savedUser = await user.save();
    res.status(201).json({
      message: "تم إنشاء المستخدم بنجاح.",
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني مختلف.",
      });
    }

    next(error);
  }
};

const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select(
      "_id firstName lastName role teacherId childrenIds",
    );
    res.json({ users });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("teacherId", "firstName lastName")
      .populate("studentIds", "firstName lastName");
    res.json({ groups });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const { teacherId, groupId, parentId } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== "Student") {
      return res.status(404).json({
        success: false,
        message: "الطالب غير موجود.",
      });
    }

    if (teacherId) {
      student.teacherId = teacherId;
    }

    if (groupId !== undefined) {
      await Group.findOneAndUpdate(
        { studentIds: student._id },
        { $pull: { studentIds: student._id } },
      );

      if (groupId) {
        await Group.findByIdAndUpdate(groupId, {
          $addToSet: { studentIds: student._id },
        });
      }
    }

    if (parentId !== undefined) {
      await User.findOneAndUpdate(
        { role: "Parent", childrenIds: student._id },
        { $pull: { childrenIds: student._id } },
      );

      if (parentId) {
        await User.findByIdAndUpdate(parentId, {
          $addToSet: { childrenIds: student._id },
        });
      }
    }

    const updatedStudent = await student.save();

    res.status(200).json({
      success: true,
      message: "تم تحديث بيانات الطالب بنجاح.",
      user: updatedStudent,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, teacherId, studentIds, description, grade } = req.body;

    if (!teacherId) {
      return res
        .status(400)
        .json({ success: false, message: "يجب تحديد المعلم." });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "يجب أن تحتوي المجموعة على طالب واحد على الأقل.",
      });
    }

    const group = new Group({
      name,
      teacherId,
      studentIds,
      description,
      grade,
    });

    const savedGroup = await group.save();
    res
      .status(201)
      .json({ message: "تم إنشاء المجموعة بنجاح.", group: savedGroup });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, teacherId, studentIds, description, grade } = req.body;

    if (!teacherId) {
      return res
        .status(400)
        .json({ success: false, message: "يجب تحديد المعلم." });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "يجب أن تحتوي المجموعة على طالب واحد على الأقل.",
      });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { name, teacherId, studentIds, description, grade },
      { new: true },
    )
      .populate("teacherId", "firstName lastName")
      .populate("studentIds", "firstName lastName");

    res.status(200).json({
      success: true,
      message: "تم تحديث المجموعة بنجاح.",
      group: updatedGroup,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.",
    });
  }
};

module.exports = {
  createUser,
  createGroup,
  updateGroup,
  updateStudent,
  getUsers,
  getGroups,
};
