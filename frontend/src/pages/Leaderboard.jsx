import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const medals = ["🥇", "🥈", "🥉"];

const formatNumber = (value) => new Intl.NumberFormat("ar-EG").format(value);

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [groupsLeaderboard, setGroupsLeaderboard] = useState([]);
  const [activeLeaderboardTab, setActiveLeaderboardTab] =
    useState("individual");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const loadLeaderboard = async () => {
      try {
        const [studentsResponse, groupsResponse] = await Promise.all([
          api.get("/leaderboard/students"),
          api.get("/leaderboard/groups"),
        ]);
        setStudents(studentsResponse.data.leaderboard || []);
        setGroupsLeaderboard(groupsResponse.data.groupsLeaderboard || []);
      } catch (err) {
        console.error("فشل تحميل لوحة المتصدرين:", err);
        setError("حدث خطأ أثناء تحميل بيانات المتصدرين. حاول لاحقًا.");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const toggleGroupExpand = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full min-w-0 bg-slate-50 text-slate-900 font-cairo"
        dir="rtl"
      >
        <Navbar role={user?.role} />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-quran-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full min-w-0 bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto w-full min-w-0 px-4 py-10 space-y-8">
        <header className="rounded-[2rem] bg-gradient-to-br from-quran-600 via-quran-700 to-quran-800 p-8 text-white shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-quran-100">
                لوحة الصدارة
              </p>
              <h1 className="mt-2 text-4xl font-semibold">قائمة المتصدرين</h1>
              <p className="mt-3 max-w-2xl text-sm text-quran-100">
                تتبع أفضل الطلاب والمجموعات في الأكاديمية وفقًا للنقاط المكتسبة
                من التقييمات اليومية والأنشطة.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <p className="font-semibold">أبرز العقول والفرق</p>
              <p className="mt-1 text-quran-100">منافسة ممتعة… ونتائج ملهمة</p>
            </div>
          </div>
        </header>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveLeaderboardTab("individual")}
            className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${
              activeLeaderboardTab === "individual"
                ? "bg-quran-600 text-white shadow-lg shadow-quran-200"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            🏆 المتصدرون الأبطال (فردي)
          </button>
          <button
            type="button"
            onClick={() => setActiveLeaderboardTab("groups")}
            className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${
              activeLeaderboardTab === "groups"
                ? "bg-quran-600 text-white shadow-lg shadow-quran-200"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            👥 صدارة المجموعات والحلقات
          </button>
        </div>

        {error ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-rose-200 text-rose-700">
            <p className="text-lg font-semibold">تعذر تحميل قائمة المتصدرين</p>
            <p className="mt-3 text-sm">{error}</p>
          </div>
        ) : (
          <>
            {activeLeaderboardTab === "individual" && (
              <div className="mx-auto max-w-3xl">
                <section className="rounded-[2rem] bg-white p-8 shadow-sm border border-slate-200">
                  <div className="mb-6 flex flex-col gap-2 text-center">
                    <h2 className="text-3xl font-semibold text-slate-900">
                      فرسان الأكاديمية
                    </h2>
                    <p className="text-sm text-slate-500">
                      أفضل 10 طلاب بناءً على النقاط المكتسبة من التقييمات
                      اليومية.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {students.length === 0 ? (
                      <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-600">
                        لا توجد بيانات متاحة حتى الآن.
                      </div>
                    ) : (
                      students.map((student, index) => (
                        <div
                          key={student.studentId}
                          className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">
                              {medals[index] || `#${index + 1}`}
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">الطالب</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {student.firstName} {student.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-3xl bg-quran-100 px-4 py-3 text-right text-sm font-semibold text-quran-800">
                            {formatNumber(student.totalPoints)} نقطة
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeLeaderboardTab === "groups" && (
              <div className="space-y-8">
                {groupsLeaderboard.map((group, groupIdx) => {
                  const top3 = group.students.slice(0, 3);
                  const remainingStudents = group.students.slice(3);
                  const isExpanded = !!expandedGroups[group.groupId];

                  return (
                    <div
                      key={group.groupId}
                      className="rounded-[2.5rem] bg-white border border-slate-200 p-6 md:p-8 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-quran-100 font-bold text-quran-800 text-sm">
                              #{groupIdx + 1}
                            </span>
                            <h3 className="text-2xl font-bold text-slate-900">
                              {group.groupName}
                            </h3>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            المعلم:{" "}
                            <span className="font-semibold text-slate-700">
                              {group.teacherName}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-left">
                          <span className="block text-xs text-emerald-700 font-medium">
                            مجموع نقاط الحلقة
                          </span>
                          <span className="text-xl font-extrabold text-emerald-900">
                            {group.totalGroupPoints} 🪙
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 md:gap-6 items-end my-6 text-center">
                        {top3[1] ? (
                          <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200">
                            <span className="text-2xl">🥈</span>
                            <p className="font-bold text-slate-800 text-sm md:text-base mt-1">
                              {top3[1].firstName} {top3[1].lastName}
                            </p>
                            <span className="inline-block mt-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                              {top3[1].points} نقطة
                            </span>
                          </div>
                        ) : (
                          <div />
                        )}

                        {top3[0] ? (
                          <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 rounded-3xl p-5 border-2 border-amber-300 transform -translate-y-2 shadow-md">
                            <span className="text-4xl block mb-1">👑 🥇</span>
                            <p className="font-extrabold text-amber-950 text-base md:text-lg">
                              {top3[0].firstName} {top3[0].lastName}
                            </p>
                            <span className="inline-block mt-2 rounded-full bg-amber-400 text-amber-950 px-4 py-1 text-xs font-bold shadow-sm">
                              {top3[0].points} نقطة
                            </span>
                          </div>
                        ) : (
                          <div />
                        )}

                        {top3[2] ? (
                          <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200">
                            <span className="text-2xl">🥉</span>
                            <p className="font-bold text-slate-800 text-sm md:text-base mt-1">
                              {top3[2].firstName} {top3[2].lastName}
                            </p>
                            <span className="inline-block mt-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                              {top3[2].points} نقطة
                            </span>
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>

                      {remainingStudents.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => toggleGroupExpand(group.groupId)}
                            className="w-full text-center text-sm font-semibold text-quran-700 hover:text-quran-800 py-2 transition flex items-center justify-center gap-2"
                          >
                            <span>
                              {isExpanded
                                ? "إخفاء باقي الطلاب"
                                : `عرض باقي أبطال الحلقة (${remainingStudents.length})`}
                            </span>
                            <span>{isExpanded ? "▲" : "▼"}</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-4 space-y-2">
                              {remainingStudents.map((student, idx) => (
                                <div
                                  key={student.studentId}
                                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-slate-400 w-6">
                                      #{idx + 4}
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                      {student.firstName} {student.lastName}
                                    </span>
                                  </div>
                                  <span className="font-bold text-quran-800">
                                    {student.points} نقطة
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
