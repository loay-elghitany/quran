const User = require("../models/user.model");
const Group = require("../models/group.model");

const createUser = async (req, res) => {
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
        message: "Invalid role. Must be Teacher, Student, or Parent.",
      });
    }

    if (role === "Student" && !teacherId) {
      return res.status(400).json({
        message: "Student must be assigned a teacher.",
      });
    }

    if (
      role === "Parent" &&
      (!Array.isArray(childrenIds) || childrenIds.length === 0)
    ) {
      return res.status(400).json({
        message: "Parent must have at least one child.",
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
      message: "User created successfully.",
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
      res.status(400).json({ message: "Email already exists." });
    } else {
      res.status(500).json({ message: "Server error." });
    }
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
    res.status(500).json({ message: "Server error." });
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("teacherId", "firstName lastName")
      .populate("studentIds", "firstName lastName");
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, teacherId, studentIds, description, grade } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher is required." });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Group must include at least one student." });
    }

    const group = new Group({
      name,
      teacherId,
      studentIds,
      description,
      grade,
    });

    const savedGroup = await group.save();
    res.status(201).json({
      message: "Group created successfully.",
      group: savedGroup,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  createUser,
  createGroup,
  getUsers,
  getGroups,
};
