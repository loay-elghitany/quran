const User = require("../models/user.model");
const Group = require("../models/group.model");
const SystemSettings = require("../models/systemSettings.model");

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

const exportStudentCredentials = async (req, res, next) => {
  try {
    const students = await User.find({ role: "Student" })
      .populate("teacherId", "firstName lastName")
      .lean();

    const escapeCsv = (value) => {
      const safeValue = value == null ? "" : String(value);
      return `"${safeValue.replace(/"/g, '""')}"`;
    };

    const rows = [
      ["اسم الطالب", "إيميل الطالب", "المعلم", "إيميل ولي الأمر"]
        .map(escapeCsv)
        .join(","),
    ];

    for (const student of students) {
      // 🕵️‍♂️ التعديل هنا: استخدمنا find بدل findOne عشان نجيب كل أولياء الأمور
      const parents = await User.find({
        role: "Parent",
        childrenIds: student._id,
      })
        .select("email")
        .lean();

      const teacherName = student.teacherId
        ? `${student.teacherId.firstName || ""} ${student.teacherId.lastName || ""}`.trim()
        : "";

      // 🕵️‍♂️ التعديل هنا: دمجنا الإيميلات لو فيه أكتر من حساب
      const parentEmails =
        parents.length > 0 ? parents.map((p) => p.email).join(" | ") : "";

      rows.push(
        [
          `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          student.email || "",
          teacherName,
          parentEmails, // 👈 هنا هينزل الإيميل المدمج
        ]
          .map(escapeCsv)
          .join(","),
      );
    }

    const csvString = `\uFEFF${rows.join("\r\n")}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students_credentials.csv",
    );
    res.send(csvString);
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

const updateTeacher = async (req, res, next) => {
  try {
    const teacherId = req.params.id;
    const { firstName, lastName, email, phone, password } = req.body;

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "Teacher") {
      return res.status(404).json({
        success: false,
        message: "المعلم غير موجود.",
      });
    }

    if (firstName !== undefined) teacher.firstName = firstName;
    if (lastName !== undefined) teacher.lastName = lastName;
    if (email !== undefined) teacher.email = email;
    if (phone !== undefined) teacher.phone = phone;
    if (password !== undefined) teacher.password = password;

    const updatedTeacher = await teacher.save();

    res.status(200).json({
      success: true,
      message: "تم تحديث بيانات المعلم بنجاح.",
      user: {
        _id: updatedTeacher._id,
        firstName: updatedTeacher.firstName,
        lastName: updatedTeacher.lastName,
        email: updatedTeacher.email,
        phone: updatedTeacher.phone,
        role: updatedTeacher.role,
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

const updateParent = async (req, res, next) => {
  try {
    const parentId = req.params.id;
    const { firstName, lastName, email, phone, password, childrenIds } =
      req.body;

    const parent = await User.findById(parentId);
    if (!parent || parent.role !== "Parent") {
      return res.status(404).json({
        success: false,
        message: "ولي الأمر غير موجود.",
      });
    }

    if (firstName !== undefined) parent.firstName = firstName;
    if (lastName !== undefined) parent.lastName = lastName;
    if (email !== undefined) parent.email = email;
    if (phone !== undefined) parent.phone = phone;
    if (password !== undefined) parent.password = password;
    if (childrenIds !== undefined) parent.childrenIds = childrenIds;

    const updatedParent = await parent.save();

    res.status(200).json({
      success: true,
      message: "تم تحديث بيانات ولي الأمر بنجاح.",
      user: {
        _id: updatedParent._id,
        firstName: updatedParent.firstName,
        lastName: updatedParent.lastName,
        email: updatedParent.email,
        phone: updatedParent.phone,
        role: updatedParent.role,
        childrenIds: updatedParent.childrenIds,
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

const getSystemSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

const updateSystemSettings = async (req, res, next) => {
  try {
    const allowedFields = [
      "attendancePoints",
      "excusedAbsencePoints",
      "unexcusedAbsencePoints",
      "gradeExcellentPoints",
      "gradeVeryGoodPoints",
      "gradeGoodPoints",
      "gradeAcceptablePoints",
      "errorPenaltyMultiplier",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: `قيمة غير صالحة للحقل "${field}". يجب أن تكون رقماً موجباً.`,
          });
        }
        updates[field] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "لم يتم توفير أي حقول صالحة للتحديث.",
      });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create(updates);
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }

    res.json({
      success: true,
      message: "تم تحديث إعدادات النظام بنجاح.",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  createGroup,
  updateGroup,
  updateStudent,
  updateTeacher,
  updateParent,
  getUsers,
  getGroups,
  exportStudentCredentials,
  getSystemSettings,
  updateSystemSettings,
};
