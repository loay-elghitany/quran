import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "YOUR_UPLOAD_PRESET";
const CLOUDINARY_URL = CLOUDINARY_CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : "";

const redemptionStatusMap = {
  pending: "قيد الانتظار",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
};

const redemptionStatusClass = {
  pending: "text-amber-600",
  approved: "text-emerald-600",
  rejected: "text-rose-600",
};

const initialRewardForm = {
  _id: "",
  name: "",
  pointsRequired: "",
  quantity: 1,
  image: "",
  imageUrl: "",
  icon: "",
  description: "",
};

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("jwtToken");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export default function AdminRewardsManager() {
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [rewardForm, setRewardForm] = useState(initialRewardForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const requestConfig = getAuthHeaders();
      const [rewardsRes, redemptionsRes] = await Promise.all([
        api.get("/admin/rewards", requestConfig),
        api.get("/admin/redemptions", requestConfig),
      ]);
      setRewards(rewardsRes.data.rewards || []);
      setRedemptions(redemptionsRes.data.redemptions || []);
    } catch (error) {
      console.error("Failed to load reward manager data:", error);
      setMessage("فشل تحميل بيانات المكافآت.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setRewardForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "imageUrl" ? { image: value } : {}),
    }));
    if (field === "imageUrl") {
      setImagePreview(value);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const response = await axios.post(CLOUDINARY_URL, formData);
      const secureUrl = response.data.secure_url;
      setRewardForm((prev) => ({
        ...prev,
        image: secureUrl,
        imageUrl: secureUrl,
      }));
      setImagePreview(secureUrl);
      setMessage("تم تحميل الصورة بنجاح.");
    } catch (error) {
      console.error(
        "Cloudinary strict error message:",
        error.response?.data?.error?.message || error.message,
      );
      setMessage(
        getApiErrorMessage(
          error,
          "فشل رفع الصورة. تحقق من إعدادات Cloudinary.",
        ),
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (reward) => {
    const imageLink = reward.image || reward.imageUrl || "";
    setRewardForm({
      _id: reward._id,
      name: reward.name || "",
      pointsRequired: reward.pointsRequired?.toString() || "",
      quantity: reward.quantity?.toString() ?? "1",
      image: imageLink,
      imageUrl: imageLink,
      icon: reward.icon || "",
      description: reward.description || "",
    });
    setImagePreview(imageLink);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setRewardForm(initialRewardForm);
    setImagePreview("");
    setMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rewardForm.name || rewardForm.pointsRequired === "") {
      setMessage("يرجى إدخال الاسم والنقاط المطلوبة.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: rewardForm.name,
        pointsRequired: Number(rewardForm.pointsRequired),
        quantity: Number(rewardForm.quantity ?? 1),
        image: rewardForm.image || rewardForm.imageUrl || "",
        icon: rewardForm.icon,
        description: rewardForm.description,
      };

      const requestConfig = getAuthHeaders();
      if (rewardForm._id) {
        await api.put(
          `/admin/rewards/${rewardForm._id}`,
          payload,
          requestConfig,
        );
        setMessage("تم تحديث المكافأة بنجاح.");
      } else {
        await api.post("/admin/rewards", payload, requestConfig);
        setMessage("تم إضافة المكافأة بنجاح.");
      }

      setRewardForm(initialRewardForm);
      await loadData();
    } catch (error) {
      console.error("Failed to save reward:", error);
      setMessage(getApiErrorMessage(error, "فشل حفظ المكافأة."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rewardId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المكافأة؟")) {
      return;
    }

    try {
      const requestConfig = getAuthHeaders();
      await api.delete(`/admin/rewards/${rewardId}`, requestConfig);
      setMessage("تم حذف المكافأة بنجاح.");
      await loadData();
    } catch (error) {
      console.error("Failed to delete reward:", error);
      setMessage(getApiErrorMessage(error, "فشل حذف المكافأة."));
    }
  };

  const handleRedemptionStatus = async (redemptionId, status) => {
    try {
      const requestConfig = getAuthHeaders();
      await api.put(
        `/admin/redemptions/${redemptionId}`,
        { status },
        requestConfig,
      );
      setMessage("تم تحديث حالة الطلب.");
      await loadData();
    } catch (error) {
      console.error("Failed to update redemption status:", error);
      setMessage(getApiErrorMessage(error, "فشل تحديث حالة الطلب."));
    }
  };

  return (
    <section className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            إدارة المكافآت وطلبات الاستبدال
          </h2>
          <p className="text-sm text-slate-500">
            أضف أو عدّل المكافآت واعرض طلبات الاستبدال بسهولة.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-3xl border border-quran-200 bg-quran-50 p-4 text-quran-900">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                اسم المكافأة
                <input
                  value={rewardForm.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                  placeholder="مثال: ساعة قراءة - 50 نقطة"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                النقاط المطلوبة
                <input
                  type="number"
                  min={0}
                  value={rewardForm.pointsRequired}
                  onChange={(e) =>
                    handleChange("pointsRequired", e.target.value)
                  }
                  className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                  placeholder="مثال: 50"
                />
              </label>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                الكمية المتاحة
                <input
                  type="number"
                  min={0}
                  value={rewardForm.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                  placeholder="مثال: 10"
                />
              </label>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-quran-500 transition cursor-pointer bg-slate-50 flex flex-col items-center justify-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="text-2xl">📤</span>
                <div>
                  <p className="font-semibold text-slate-900">
                    اسحب وأفلت هنا أو انقر لتحميل
                  </p>
                  <p className="text-sm text-slate-500">
                    تنسيق JPEG أو PNG، يُرفع إلى Cloudinary تلقائيًا
                  </p>
                </div>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                أو رابط الصورة
                <input
                  type="url"
                  value={rewardForm.imageUrl}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                  placeholder="https://res.cloudinary.com/..."
                />
              </label>
            </div>
            {imagePreview ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500 mb-4">معاينة الصورة:</p>
                <div className="w-32 h-32 mx-auto overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={imagePreview}
                    alt="معاينة المكافأة"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                أيقونة / رمز تعريفي
                <input
                  value={rewardForm.icon}
                  onChange={(e) => handleChange("icon", e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                  placeholder="مثال: 🏅"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                وصف قصير
                <input
                  value={rewardForm.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                  placeholder="مثال: مكافأة للطالب المتميز"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-3xl bg-quran-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-quran-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {rewardForm._id ? "تحديث المكافأة" : "إضافة مكافأة"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-3xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                إعادة تعيين النموذج
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-quran-200 bg-quran-50 p-6 text-slate-600">
                جارٍ التحميل...
              </div>
            ) : rewards.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                لا توجد مكافآت مسجلة.
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <div
                    key={reward._id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-quran-50 text-2xl">
                            {reward.icon || "🏅"}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {reward.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {reward.description || "وصف المكافأة غير متوفر."}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-quran-100 px-3 py-2 text-sm font-semibold text-quran-800">
                          {reward.pointsRequired} نقطة
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                          الكمية: {reward.quantity ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEdit(reward)}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(reward._id)}
                          className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            طلبات الاستبدال
          </h3>
          {loading ? (
            <p className="text-sm text-slate-500">جارٍ التحميل...</p>
          ) : redemptions.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600">
              لا توجد طلبات جديدة.
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-right">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      اسم الطالب
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      المكافأة
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {redemptions.map((item) => (
                    <tr key={item._id}>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900">
                        {item.studentId?.firstName} {item.studentId?.lastName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900">
                        {item.rewardId?.name || "غير محدد"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span
                          className={`font-semibold ${redemptionStatusClass[item.status] || "text-slate-700"}`}
                        >
                          {redemptionStatusMap[item.status] || item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRedemptionStatus(item._id, "approved")
                            }
                            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            موافقة
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRedemptionStatus(item._id, "rejected")
                            }
                            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                          >
                            رفض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
