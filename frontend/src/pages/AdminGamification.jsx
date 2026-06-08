import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";
import Navbar from "../components/Navbar";

export default function AdminGamification() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("badges");

  // Badge State
  const [badges, setBadges] = useState([]);
  const [newBadge, setNewBadge] = useState({
    name: "",
    icon: "🏅",
    description: "",
    pointsReward: 0,
    maxPerMonth: 5,
  });
  const [badgeMessage, setBadgeMessage] = useState("");

  // Challenge State
  const [challenges, setChallenges] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    groupId: "",
    targetPoints: 100,
    rewardDescription: "",
    deadline: "",
  });
  const [challengeMessage, setChallengeMessage] = useState("");

  // Mystery Box State
  const [mysteryBox, setMysteryBox] = useState(null);
  const [editingMysteryBox, setEditingMysteryBox] = useState(false);
  const [mysteryBoxForm, setMysteryBoxForm] = useState({
    cost: 100,
    description: "افتح صندوق الأسرار واكسب مفاجأة!",
    possibleRewards: [],
    isActive: true,
  });
  const [mysteryBoxMessage, setMysteryBoxMessage] = useState("");
  const [newReward, setNewReward] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadBadges();
    loadChallenges();
    loadGroups();
    loadMysteryBox();
  }, []);

  const loadBadges = async () => {
    try {
      const response = await api.get("/admin/badges");
      setBadges(response.data.badges || []);
    } catch (error) {
      console.error("Failed to load badges:", error);
    }
  };

  const loadChallenges = async () => {
    try {
      const response = await api.get("/admin/challenges");
      setChallenges(response.data.challenges || []);
    } catch (error) {
      console.error("Failed to load challenges:", error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await api.get("/admin/groups");
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  };

  const loadMysteryBox = async () => {
    try {
      const response = await api.get("/admin/mystery-box");
      const config = response.data.config;
      setMysteryBox(config);
      setMysteryBoxForm({
        cost: config.cost,
        description: config.description,
        possibleRewards: config.possibleRewards || [],
        isActive: config.isActive,
      });
    } catch (error) {
      console.error("Failed to load mystery box config:", error);
    }
  };

  // Badge Handlers
  const handleCreateBadge = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/badges", newBadge);
      setBadgeMessage("تم إنشاء الوسام بنجاح!");
      setNewBadge({
        name: "",
        icon: "🏅",
        description: "",
        pointsReward: 0,
        maxPerMonth: 5,
      });
      loadBadges();
      setTimeout(() => setBadgeMessage(""), 3000);
    } catch (error) {
      setBadgeMessage(getApiErrorMessage(error, "فشل إنشاء الوسام."));
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الوسام؟")) return;
    try {
      await api.delete(`/admin/badges/${badgeId}`);
      setBadgeMessage("تم حذف الوسام بنجاح!");
      loadBadges();
      setTimeout(() => setBadgeMessage(""), 3000);
    } catch (error) {
      setBadgeMessage(getApiErrorMessage(error, "فشل حذف الوسام."));
    }
  };

  // Challenge Handlers
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/challenges", newChallenge);
      setChallengeMessage("تم إنشاء التحدي بنجاح!");
      setNewChallenge({
        title: "",
        groupId: "",
        targetPoints: 100,
        rewardDescription: "",
        deadline: "",
      });
      loadChallenges();
      setTimeout(() => setChallengeMessage(""), 3000);
    } catch (error) {
      setChallengeMessage(getApiErrorMessage(error, "فشل إنشاء التحدي."));
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التحدي؟")) return;
    try {
      await api.delete(`/admin/challenges/${challengeId}`);
      setChallengeMessage("تم حذف التحدي بنجاح!");
      loadChallenges();
      setTimeout(() => setChallengeMessage(""), 3000);
    } catch (error) {
      setChallengeMessage(getApiErrorMessage(error, "فشل حذف التحدي."));
    }
  };

  // Mystery Box Handlers
  const handleAddReward = () => {
    if (!newReward.trim()) return;
    setMysteryBoxForm((prev) => ({
      ...prev,
      possibleRewards: [
        ...prev.possibleRewards,
        {
          text: newReward,
          probability: 1 / (prev.possibleRewards.length + 1),
        },
      ],
    }));
    setNewReward("");
  };

  const handleRemoveReward = (index) => {
    setMysteryBoxForm((prev) => ({
      ...prev,
      possibleRewards: prev.possibleRewards.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateMysteryBox = async () => {
    try {
      await api.put("/admin/mystery-box", mysteryBoxForm);
      setMysteryBoxMessage("تم تحديث صندوق الأسرار بنجاح!");
      setEditingMysteryBox(false);
      loadMysteryBox();
      setTimeout(() => setMysteryBoxMessage(""), 3000);
    } catch (error) {
      setMysteryBoxMessage(
        getApiErrorMessage(error, "فشل تحديث صندوق الأسرار."),
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 mb-8">
          <h1 className="text-4xl font-semibold text-slate-900">
            إدارة المكافآت والألعاب
          </h1>
          <p className="mt-2 text-slate-600">
            إدارة الأوسمة والتحديات وصندوق الأسرار
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-col gap-4 mb-8 sm:flex-row">
          {["badges", "challenges", "mysteryBox"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-3xl px-6 py-3 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-quran-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab === "badges"
                ? "الأوسمة"
                : tab === "challenges"
                  ? "التحديات"
                  : "صندوق الأسرار"}
            </button>
          ))}
        </div>

        {/* Badges Tab */}
        {activeTab === "badges" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                إنشاء وسام جديد
              </h2>
              <form onSubmit={handleCreateBadge} className="space-y-4">
                <label className="block text-sm text-slate-700">
                  اسم الوسام
                  <input
                    type="text"
                    value={newBadge.name}
                    onChange={(e) =>
                      setNewBadge({ ...newBadge, name: e.target.value })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    required
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  الرمز (Emoji)
                  <input
                    type="text"
                    value={newBadge.icon}
                    onChange={(e) =>
                      setNewBadge({ ...newBadge, icon: e.target.value })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  الوصف
                  <textarea
                    value={newBadge.description}
                    onChange={(e) =>
                      setNewBadge({ ...newBadge, description: e.target.value })
                    }
                    rows={3}
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  نقاط المكافأة
                  <input
                    type="number"
                    value={newBadge.pointsReward}
                    onChange={(e) =>
                      setNewBadge({
                        ...newBadge,
                        pointsReward: Number(e.target.value),
                      })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    min={0}
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  الحد الأقصى شهريًا
                  <input
                    type="number"
                    value={newBadge.maxPerMonth}
                    onChange={(e) =>
                      setNewBadge({
                        ...newBadge,
                        maxPerMonth: Number(e.target.value),
                      })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    min={0}
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-3xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white hover:bg-quran-700 transition"
                >
                  إنشاء الوسام
                </button>
              </form>
              {badgeMessage && (
                <p className="mt-4 text-sm text-slate-600">{badgeMessage}</p>
              )}
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                الأوسمة الحالية
              </h2>
              <div className="space-y-4">
                {badges.map((badge) => (
                  <div
                    key={badge._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{badge.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {badge.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          النقاط: {badge.pointsReward} | الحد الأقصى:{" "}
                          {badge.maxPerMonth}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBadge(badge._id)}
                      className="rounded-2xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                    >
                      حذف
                    </button>
                  </div>
                ))}
                {badges.length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    لا توجد أوسمة بعد.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                إنشاء تحدي جديد
              </h2>
              <form onSubmit={handleCreateChallenge} className="space-y-4">
                <label className="block text-sm text-slate-700">
                  عنوان التحدي
                  <input
                    type="text"
                    value={newChallenge.title}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        title: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    required
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  اختر المجموعة
                  <select
                    value={newChallenge.groupId}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        groupId: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    required
                  >
                    <option value="">-- اختر مجموعة --</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-700">
                  النقاط المطلوبة
                  <input
                    type="number"
                    value={newChallenge.targetPoints}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        targetPoints: Number(e.target.value),
                      })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    min={1}
                    required
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  وصف المكافأة
                  <textarea
                    value={newChallenge.rewardDescription}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        rewardDescription: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  الموعد النهائي
                  <input
                    type="datetime-local"
                    value={newChallenge.deadline}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        deadline: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-3xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white hover:bg-quran-700 transition"
                >
                  إنشاء التحدي
                </button>
              </form>
              {challengeMessage && (
                <p className="mt-4 text-sm text-slate-600">
                  {challengeMessage}
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                التحديات النشطة
              </h2>
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {challenge.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {challenge.groupId?.name} | {challenge.currentPoints}/
                          {challenge.targetPoints} نقاط
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteChallenge(challenge._id)}
                        className="rounded-2xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
                {challenges.length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    لا توجد تحديات بعد.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mystery Box Tab */}
        {activeTab === "mysteryBox" && (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              إعدادات صندوق الأسرار
            </h2>

            {!editingMysteryBox ? (
              <div className="space-y-4">
                <div className="rounded-3xl bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">السعر</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {mysteryBox?.cost} نقطة
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">الوصف</p>
                  <p className="text-base text-slate-900">
                    {mysteryBox?.description}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-6">
                  <p className="text-sm text-slate-500 mb-4">
                    المكافآت المحتملة
                  </p>
                  <div className="grid gap-2">
                    {mysteryBox?.possibleRewards?.map((reward, idx) => (
                      <p key={idx} className="text-slate-700">
                        {reward.text}
                      </p>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setEditingMysteryBox(true)}
                  className="w-full rounded-3xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white hover:bg-quran-700 transition"
                >
                  تعديل
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm text-slate-700">
                  السعر
                  <input
                    type="number"
                    value={mysteryBoxForm.cost}
                    onChange={(e) =>
                      setMysteryBoxForm({
                        ...mysteryBoxForm,
                        cost: Number(e.target.value),
                      })
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    min={0}
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  الوصف
                  <textarea
                    value={mysteryBoxForm.description}
                    onChange={(e) =>
                      setMysteryBoxForm({
                        ...mysteryBoxForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <div className="rounded-3xl bg-slate-50 p-6">
                  <p className="text-sm text-slate-500 mb-4">
                    إضافة/إزالة المكافآت
                  </p>
                  <div className="space-y-3">
                    {mysteryBoxForm.possibleRewards.map((reward, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-3"
                      >
                        <p className="text-slate-700">{reward.text}</p>
                        <button
                          onClick={() => handleRemoveReward(idx)}
                          className="text-rose-600 font-semibold hover:text-rose-700"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={newReward}
                      onChange={(e) => setNewReward(e.target.value)}
                      placeholder="اسم المكافأة الجديدة..."
                      className="flex-1 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    />
                    <button
                      onClick={handleAddReward}
                      className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={mysteryBoxForm.isActive}
                    onChange={(e) =>
                      setMysteryBoxForm({
                        ...mysteryBoxForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-slate-700">تفعيل صندوق الأسرار</span>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateMysteryBox}
                    className="flex-1 rounded-3xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white hover:bg-quran-700 transition"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setEditingMysteryBox(false)}
                    className="flex-1 rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
            {mysteryBoxMessage && (
              <p className="mt-4 text-sm text-slate-600">{mysteryBoxMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
