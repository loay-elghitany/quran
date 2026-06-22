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

function RewardCard({ reward, onRedeem, disabled }) {
  return (
    <div className="rounded-3xl border border-quran-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-quran-50 text-3xl">
          {reward.icon || "🏅"}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {reward.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {reward.description || "وصف المكافأة"}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="rounded-full bg-quran-100 px-3 py-2 text-sm font-semibold text-quran-800">
          {reward.pointsRequired} نقطة
        </span>
        {onRedeem ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRedeem(reward._id)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              disabled
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-quran-700 text-white hover:bg-quran-800"
            }`}
          >
            اطلبها
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
    description: "",
    icon: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
        description: newReward.description,
        icon: newReward.icon,
      });
      setMessage("تم إضافة المكافأة بنجاح.");
      setNewReward({ name: "", pointsRequired: "", description: "", icon: "" });
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
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rewards.length === 0 ? (
                <p className="text-slate-600">لا توجد مكافآت متاحة.</p>
              ) : (
                rewards.map((reward) => (
                  <RewardCard
                    key={reward._id}
                    reward={reward}
                    onRedeem={userRole === "Student" ? handleRedeem : null}
                    disabled={
                      userRole === "Student" &&
                      availablePoints < reward.pointsRequired
                    }
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
              value={newReward.icon}
              onChange={(e) =>
                setNewReward({ ...newReward, icon: e.target.value })
              }
              placeholder="أيقونة (اختياري)"
              className="rounded-3xl border border-slate-200 p-4 text-slate-900"
            />
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
    </div>
  );
}
