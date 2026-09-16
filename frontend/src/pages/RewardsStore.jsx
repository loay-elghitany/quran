import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import api from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";
import Navbar from "../components/Navbar";

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

function getYouTubeEmbedUrl(url) {
  if (!url) return null;

  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/,
  );

  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
}

function RewardCard({
  reward,
  onRedeem,
  disabled,
  availablePoints,
  onWatchVideo,
}) {
  const imageUrl = reward.image || reward.imageUrl || "";
  const isOutOfStock =
    reward.quantity === undefined || Number(reward.quantity) <= 0;
  const hasEnoughPoints = availablePoints >= reward.pointsRequired;
  const isDisabled = Boolean(disabled) || isOutOfStock || !hasEnoughPoints;

  let buttonText = "اطلبها";
  let buttonClassName = "bg-emerald-600 text-white hover:bg-emerald-700";

  if (isOutOfStock) {
    buttonText = "نفدت الكمية";
    buttonClassName = "cursor-not-allowed bg-slate-200 text-slate-500";
  } else if (!hasEnoughPoints) {
    buttonText = "النقاط غير كافية";
    buttonClassName =
      "cursor-not-allowed border border-amber-300 bg-amber-50 text-amber-700";
  }

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-xl">
      <div>
        <div className="relative h-52 w-full overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={reward.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-emerald-50 via-teal-50 to-slate-100 text-5xl">
              {reward.icon || "🎁"}
            </div>
          )}
          <div className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-amber-300 shadow-md backdrop-blur-md">
            🪙 {reward.pointsRequired} نقطة
          </div>
          {reward.youtubeUrl ? (
            <button
              type="button"
              onClick={() => onWatchVideo(reward.youtubeUrl)}
              className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition hover:bg-red-600 active:scale-95"
            >
              <span aria-hidden="true">▶</span>
              مشاهدة الفيديو
            </button>
          ) : null}
        </div>
        <div className="space-y-2 p-5">
          <h3 className="line-clamp-1 text-lg font-bold text-slate-800">
            {reward.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
            {reward.description || "مكافأة مميزة لأبطال حلقات القرآن الكريم."}
          </p>
        </div>
      </div>
      <div className="p-5 pt-0">
        <div className="mb-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>الكمية المتوفرة:</span>
          <span
            className={`font-bold ${isOutOfStock ? "text-rose-500" : "text-emerald-600"}`}
          >
            {isOutOfStock ? "نفدت الكمية" : `${reward.quantity} قطع`}
          </span>
        </div>
        {onRedeem ? (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => onRedeem(reward._id)}
            className={`w-full rounded-2xl py-2.5 text-sm font-bold shadow-sm transition ${
              isOutOfStock
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : !hasEnoughPoints
                  ? "cursor-not-allowed border border-amber-200 bg-amber-50 text-amber-600"
                  : "bg-emerald-600 text-white shadow-emerald-200/50 hover:bg-emerald-700 active:scale-[0.98]"
            }`}
          >
            {isOutOfStock
              ? "نفدت الكمية"
              : !hasEnoughPoints
                ? "النقاط غير كافية"
                : "استبدال الآن 🎁"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function RewardsStore() {
  const [userRole, setUserRole] = useState("");
  const [availablePoints, setAvailablePoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [reservedPoints, setReservedPoints] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [adminRedemptions, setAdminRedemptions] = useState([]);
  const [newReward, setNewReward] = useState({
    name: "",
    pointsRequired: "",
    quantity: 1,
    description: "",
    icon: "",
    image: "",
    imageUrl: "",
    youtubeUrl: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserRole(parsed.role);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (userRole === "Student") {
          const response = await api.get("/student/rewards");
          setAvailablePoints(response.data.availablePoints);
          setTotalPoints(response.data.totalPoints);
          setReservedPoints(response.data.reservedPoints);
          setRewards(response.data.rewards || []);
          setRedemptions(response.data.redemptions || []);
        } else if (userRole === "SuperAdmin" || userRole === "Admin") {
          const [rewardsRes, redemptionsRes] = await Promise.all([
            api.get("/admin/rewards"),
            api.get("/admin/redemptions"),
          ]);
          setRewards(rewardsRes.data.rewards || []);
          setAdminRedemptions(redemptionsRes.data.redemptions || []);
        }
      } catch (error) {
        console.error(error);
        setMessage("فشل تحميل بيانات المكافآت.");
      } finally {
        setLoading(false);
      }
    };

    if (userRole) {
      loadData();
    }
  }, [userRole]);

  const refreshStudentData = async () => {
    try {
      const response = await api.get("/student/rewards");
      setAvailablePoints(response.data.availablePoints);
      setTotalPoints(response.data.totalPoints);
      setReservedPoints(response.data.reservedPoints);
      setRewards(response.data.rewards || []);
      setRedemptions(response.data.redemptions || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRedeem = async (rewardId) => {
    try {
      await api.post("/student/redeem", { rewardId });
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FF8C00", "#32CD32", "#1E90FF"],
      });
      setMessage("رائع! تم إرسال طلبك بنجاح.");
      refreshStudentData();
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, "فشل طلب الاستبدال."));
    }
  };

  const handleRewardSave = async (event) => {
    event.preventDefault();
    try {
      await api.post("/admin/rewards", {
        name: newReward.name,
        pointsRequired: Number(newReward.pointsRequired),
        quantity: Number(newReward.quantity ?? 1),
        image: newReward.image || newReward.imageUrl || "",
        youtubeUrl: newReward.youtubeUrl || "",
        description: newReward.description,
        icon: newReward.icon,
      });
      setMessage("تم إضافة المكافأة بنجاح.");
      setNewReward({
        name: "",
        pointsRequired: "",
        quantity: 1,
        description: "",
        icon: "",
        image: "",
        imageUrl: "",
        youtubeUrl: "",
      });
      const response = await api.get("/admin/rewards");
      setRewards(response.data.rewards || []);
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, "فشل حفظ المكافأة."));
    }
  };

  const handleStatusChange = async (redemptionId, status) => {
    try {
      await api.put(`/admin/redemptions/${redemptionId}`, { status });
      const response = await api.get("/admin/redemptions");
      setAdminRedemptions(response.data.redemptions || []);
      setMessage("تم تحديث حالة الطلب.");
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, "فشل تحديث الحالة."));
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 space-y-8 px-4 py-6 lg:px-10">
      <Navbar role={userRole} />
      <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm w-full min-w-0">
        <h1 className="text-3xl font-semibold text-slate-900">متجر المكافآت</h1>
        <p className="mt-2 text-slate-600">
          استعرض النقاط المتاحة والمكافآت المتوفرة واطلب الاستبدال بسهولة.
        </p>
      </div>

      {message ? (
        <div className="rounded-3xl border border-quran-200 bg-quran-50 p-4 text-quran-900">
          {message}
        </div>
      ) : null}

      {userRole === "Student" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">النقاط المتاحة</p>
            <p className="mt-3 text-4xl font-semibold text-quran-700">
              {availablePoints}
            </p>
          </div>
          <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">إجمالي النقاط</p>
            <p className="mt-3 text-4xl font-semibold text-quran-700">
              {totalPoints}
            </p>
          </div>
          <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">النقاط المحجوزة</p>
            <p className="mt-3 text-4xl font-semibold text-quran-700">
              {reservedPoints}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-quran-200 bg-quran-50 p-6 shadow-sm">
          جارٍ التحميل...
        </div>
      ) : userRole === "Student" ||
        userRole === "SuperAdmin" ||
        userRole === "Admin" ? (
        <div className="grid gap-6 xl:grid-cols-2 w-full min-w-0">
          <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm w-full min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">
              المكافآت المتاحة
            </h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rewards.length === 0 ? (
                <p className="text-slate-600">لا توجد مكافآت متاحة.</p>
              ) : (
                rewards.map((reward) => (
                  <RewardCard
                    key={reward._id}
                    reward={reward}
                    onRedeem={userRole === "Student" ? handleRedeem : null}
                    disabled={false}
                    availablePoints={availablePoints}
                    onWatchVideo={(url) => setActiveVideoUrl(url)}
                  />
                ))
              )}
            </div>
          </div>

          {userRole === "Student" ? (
            <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                طلباتي الحالية
              </h2>
              <div className="mt-5 space-y-4">
                {redemptions.length === 0 ? (
                  <p className="text-slate-600">ليس لديك أي طلبات حتى الآن.</p>
                ) : (
                  redemptions.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-3xl border border-slate-200 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {item.rewardId?.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        الحالة:{" "}
                        <span
                          className={`font-semibold ${redemptionStatusClass[item.status] || "text-slate-700"}`}
                        >
                          {redemptionStatusMap[item.status] || item.status}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        عدد النقاط: {item.pointsRequired}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                طلبات الاستبدال
              </h2>
              <div className="mt-5 space-y-4">
                {adminRedemptions.length === 0 ? (
                  <p className="text-slate-600">لا توجد طلبات استبدال جديدة.</p>
                ) : (
                  adminRedemptions.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-3xl border border-slate-200 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {item.rewardId?.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.studentId?.firstName} {item.studentId?.lastName}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        الحالة:{" "}
                        <span
                          className={`font-semibold ${redemptionStatusClass[item.status] || "text-slate-700"}`}
                        >
                          {redemptionStatusMap[item.status] || item.status}
                        </span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(item._id, "approved")
                          }
                          className="rounded-2xl bg-emerald-600 px-4 py-2 text-white"
                        >
                          اعتماد
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(item._id, "rejected")
                          }
                          className="rounded-2xl bg-rose-600 px-4 py-2 text-white"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">هذه الصفحة مخصصة للطلاب والمسؤولين.</p>
        </div>
      )}

      {(userRole === "SuperAdmin" || userRole === "Admin") && (
        <div className="rounded-3xl border border-quran-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            إضافة مكافأة جديدة
          </h2>
          <form onSubmit={handleRewardSave} className="mt-5 grid gap-4">
            <input
              value={newReward.name}
              onChange={(e) =>
                setNewReward({ ...newReward, name: e.target.value })
              }
              placeholder="اسم المكافأة"
              className="rounded-3xl border border-slate-200 p-4 text-slate-900"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <input
                type="number"
                value={newReward.pointsRequired}
                onChange={(e) =>
                  setNewReward({ ...newReward, pointsRequired: e.target.value })
                }
                placeholder="النقاط المطلوبة"
                className="rounded-3xl border border-slate-200 p-4 text-slate-900"
              />
              <input
                type="number"
                min={0}
                value={newReward.quantity}
                onChange={(e) =>
                  setNewReward({ ...newReward, quantity: e.target.value })
                }
                placeholder="الكمية المتاحة"
                className="rounded-3xl border border-slate-200 p-4 text-slate-900"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                رابط الصورة
                <input
                  type="url"
                  value={newReward.imageUrl}
                  onChange={(e) =>
                    setNewReward({
                      ...newReward,
                      imageUrl: e.target.value,
                      image: e.target.value,
                    })
                  }
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full rounded-3xl border border-slate-200 p-4 text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                رابط فيديو يوتيوب (اختياري)
                <input
                  type="url"
                  value={newReward.youtubeUrl}
                  onChange={(e) =>
                    setNewReward({ ...newReward, youtubeUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-3xl border border-slate-200 p-4 text-left text-slate-900"
                  dir="ltr"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                أيقونة (اختياري)
                <input
                  value={newReward.icon}
                  onChange={(e) =>
                    setNewReward({ ...newReward, icon: e.target.value })
                  }
                  placeholder="🏅"
                  className="w-full rounded-3xl border border-slate-200 p-4 text-slate-900"
                />
              </label>
            </div>
            <textarea
              value={newReward.description}
              onChange={(e) =>
                setNewReward({ ...newReward, description: e.target.value })
              }
              placeholder="وصف المكافأة"
              className="rounded-3xl border border-slate-200 p-4 text-slate-900"
            />
            <button
              type="submit"
              className="rounded-3xl bg-quran-700 px-6 py-3 text-white hover:bg-quran-800"
            >
              حفظ المكافأة
            </button>
          </form>
        </div>
      )}

      {activeVideoUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة فيديو المكافأة"
          onClick={() => setActiveVideoUrl(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveVideoUrl(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/40"
              aria-label="إغلاق الفيديو"
            >
              ✕
            </button>
            <div className="relative aspect-video">
              {getYouTubeEmbedUrl(activeVideoUrl) ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={getYouTubeEmbedUrl(activeVideoUrl)}
                  title="معاينة المنتج"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-white">
                  رابط الفيديو غير صالح.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
