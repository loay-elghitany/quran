const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");
const User = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return next(
        new ApiError("الرجاء تسجيل الدخول للوصول إلى هذا المورد.", 401),
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        new ApiError("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.", 401),
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.", 401));
  }
};

module.exports = authMiddleware;
