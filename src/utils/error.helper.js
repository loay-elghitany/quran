const fieldNameMap = {
  phone: "رقم الهاتف",
  email: "البريد الإلكتروني",
  nationalId: "الرقم الوطني",
  username: "اسم المستخدم",
  name: "الاسم",
  firstName: "الاسم الأول",
  lastName: "اسم العائلة",
  teacherId: "المعلم",
  studentId: "الطالب",
  parentId: "ولي الأمر",
  childrenIds: "الأطفال",
  senderEmail: "البريد الإلكتروني للمرسل",
  senderName: "اسم المرسل",
  title: "العنوان",
  description: "الوصف",
  type: "النوع",
  priority: "الأولوية",
  role: "الدور",
  password: "كلمة المرور",
  confirmPassword: "تأكيد كلمة المرور",
  phoneNumber: "رقم الهاتف",
};

const getFieldLabel = (field) => {
  if (!field) return "هذا الحقل";
  if (fieldNameMap[field]) return fieldNameMap[field];
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim();
};

const mapMongoValidationError = (err) => {
  const details = Object.keys(err.errors || {}).map((field) => ({
    field,
    message: err.errors[field]?.message || getFieldLabel(field),
  }));

  const message = details.length
    ? details[0].message
    : "البيانات المرسلة غير صحيحة. يرجى التحقق وإعادة المحاولة.";

  return {
    statusCode: 400,
    message,
    details,
  };
};

const mapDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
  const fieldLabel = getFieldLabel(field);
  const message = fieldLabel
    ? `عذراً، ${fieldLabel} مسجل بالفعل لمستخدم آخر. يرجى استخدام رقم آخر.`
    : "عذراً، هناك قيمة مكررة في بيانات الإدخال. يرجى التحقق وإعادة المحاولة.";

  return {
    statusCode: 409,
    message,
    field,
    details: [{ field, message }],
  };
};

const mapCastError = () => ({
  statusCode: 400,
  message: "عذراً، المعرّف المرسل غير صحيح أو غير موجود.",
});

const mapJwtError = () => ({
  statusCode: 401,
  message: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.",
});

const mapJoiError = (err) => ({
  statusCode: 400,
  message:
    "البيانات المرسلة غير صحيحة. يرجى التحقق من المعلومات وإعادة المحاولة.",
  details: err.details?.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message,
  })),
});

const mapMulterError = (err) => {
  let message = "حصل خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.";
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "حجم الملف أكبر من الحد المسموح به.";
  } else if (err.code === "LIMIT_FILE_COUNT") {
    message = "عدد الملفات المرسل أكبر من الحد المسموح به.";
  }
  return {
    statusCode: 400,
    message,
  };
};

const mapErrorToResponse = (err) => {
  if (!err || typeof err !== "object") {
    return {
      statusCode: 500,
      message:
        "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً أو الاتصال بالدعم الفني.",
    };
  }

  if (err.name === "ValidationError") {
    return mapMongoValidationError(err);
  }

  if (err.name === "CastError") {
    return mapCastError();
  }

  if (err.code === 11000) {
    return mapDuplicateKeyError(err);
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return mapJwtError();
  }

  if (err.isJoi) {
    return mapJoiError(err);
  }

  if (err.name === "MulterError") {
    return mapMulterError(err);
  }

  if (err.status === 429 || err.statusCode === 429) {
    return {
      statusCode: 429,
      message:
        err.message ||
        "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقًا.",
    };
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode >= 500
      ? "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً أو الاتصال بالدعم الفني."
      : err.message || "حدث خطأ في الطلب. يرجى التحقق وإعادة المحاولة.";

  return {
    statusCode,
    message,
    details: err.details,
    field: err.field,
  };
};

module.exports = {
  mapErrorToResponse,
};
