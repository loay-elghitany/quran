const ApiError = require("../utils/apiError");

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError("الرجاء تسجيل الدخول للوصول إلى هذا المورد.", 401),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          "عذراً، ليس لديك الصلاحية الكافية للوصول إلى هذه الصفحة.",
          403,
        ),
      );
    }

    next();
  };
};

module.exports = roleMiddleware;
