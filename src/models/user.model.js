const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const roles = ["SuperAdmin", "Teacher", "Student", "Parent"];

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, "Please use a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: {
      values: roles,
      message: "Role must be SuperAdmin, Teacher, Student, or Parent",
    },
  },
  avatar: {
    type: String,
    trim: true,
    default: "",
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [
      function () {
        return this.role === "Student";
      },
      "Student must have an assigned teacher",
    ],
  },
  childrenIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  assignedGroups: [
    {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  points: {
    type: Number,
    default: 0,
  },
  badges: [
    {
      badgeId: {
        type: Schema.Types.ObjectId,
        ref: "Badge",
      },
      awardedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      awardedAt: {
        type: Date,
        default: () => new Date(),
      },
    },
  ],
  evaluationStreak: {
    currentGrade: {
      type: String,
      default: "",
    },
    count: {
      type: Number,
      default: 0,
    },
    maxStreak: {
      type: Number,
      default: 0,
    },
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

UserSchema.path("childrenIds").validate(function (value) {
  if (this.role !== "Parent") return true;
  return Array.isArray(value) && value.length > 0;
}, "Parent must have at least one child.");

UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model("User", UserSchema);
