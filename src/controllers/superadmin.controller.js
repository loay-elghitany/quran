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

const createGroup = async (req, res) => {
  try {
    const { name, teacherId, studentIds, description, grade } = req.body;

    if (!teacherId) {
      return res
        .status(400)
        .json({ success: false, message: "يجب تحديد المعلم." });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res
        .status(400)
        .json({
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
      return res
        .status(400)
        .json({
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
  getUsers,
  getGroups,
};
