import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const medals = ["🥇", "🥈", "🥉"];

const formatNumber = (value) => new Intl.NumberFormat("ar-EG").format(value);

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const loadLeaderboard = async () => {
      try {
        const response = await api.get("/leaderboard/students");
        setStudents(response.data.leaderboard || []);
      } catch (err) {
        console.error("فشل تحميل لوحة المتصدرين:", err);
        setError("حدث خطأ أثناء تحميل بيانات المتصدرين. حاول لاحقًا.");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

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
        <header className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h1 className="text-4xl font-semibold text-slate-900">
            قائمة المتصدرين
          </h1>
          <p className="mt-3 text-slate-600">
            تتبع أفضل الطلاب في الأكاديمية وفقًا للنقاط المكتسبة من التقييمات
            اليومية.
          </p>
        </header>

        {error ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-rose-200 text-rose-700">
            <p className="text-lg font-semibold">تعذر تحميل قائمة المتصدرين</p>
            <p className="mt-3 text-sm">{error}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
              <div className="mb-6 flex flex-col gap-2 text-center">
                <h2 className="text-3xl font-semibold text-slate-900">
                  فرسان الأكاديمية
                </h2>
                <p className="text-sm text-slate-500">
                  أفضل 10 طلاب بناءً على النقاط المكتسبة من التقييمات اليومية.
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
      </div>
    </div>
  );
}
