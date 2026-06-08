export function getApiErrorMessage(
  error,
  fallback = "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.",
) {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  const errors = error.response?.data?.errors;
  if (errors) {
    if (Array.isArray(errors)) {
      return (
        errors
          .map((err) => err?.message || err)
          .filter(Boolean)
          .join("، ") || fallback
      );
    }

    if (typeof errors === "string") {
      return errors;
    }
  }

  if (error.message) return error.message;
  if (error.response?.statusText) return error.response.statusText;

  return fallback;
}
