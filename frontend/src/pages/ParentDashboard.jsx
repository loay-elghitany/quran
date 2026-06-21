import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import PointsSystemGuide from "../components/PointsSystemGuide";
import AnnouncementsBanner from "../components/AnnouncementsBanner";

const formatDate = (isoDate) => {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
};

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [todayLessons, setTodayLessons] = useState({});
  const [todayLessonLoading, setTodayLessonLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/parent/dashboard");
        setDashboard(response.data);
      } catch (err) {
        console.error("فشل تحميل لوحة ولي الأمر:", err);
        setError("حدث خطأ أثناء تحميل بيانات ولي الأمر. حاول لاحقا.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadTodayLessons = async () => {
      if (!dashboard?.children?.length) {
        setTodayLessons({});
        setTodayLessonLoading(false);
        return;
      }

      try {
        setTodayLessonLoading(true);
        const lessonData = {};
        await Promise.all(
          dashboard.children.map(async (child) => {
            if (!child.group?._id) {
              lessonData[child._id] = null;
              return;
            }
            try {
              const response = await api.get(
                `/groups/${child.group._id}/current-lesson`,
              );
              lessonData[child._id] = response.data;
            } catch (error) {
              lessonData[child._id] = null;
            }
          }),
        );
        setTodayLessons(lessonData);
      } catch (err) {
        console.error("فشل تحميل دروس اليوم:", err);
      } finally {
        setTodayLessonLoading(false);
      }
    };

    if (dashboard) {
      loadTodayLessons();
    }
  }, [dashboard]);

  const openChildModal = (child) => {
    setSelectedChild(child);
  };

  const closeChildModal = () => {
    setSelectedChild(null);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
        dir="rtl"
      >
        <Navbar role={user?.role} />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-quran-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
        dir="rtl"
      >
        <Navbar role={user?.role} />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-rose-200 text-rose-700">
            <h1 className="text-2xl font-semibold">
              تعذر تحميل لوحة ولي الأمر
            </h1>
            <p className="mt-4 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 mb-8">
          <AnnouncementsBanner />
          <div className="mt-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-quran-600">
                  لوحة ولي الأمر
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                  مرحبا {dashboard.parent.firstName} {dashboard.parent.lastName}
                </h1>
                <p className="mt-3 text-slate-600">
                  اطلع على تقدم أبنائك استعرض سجل التقييمات وتواصل مع المدرسة
                  بسهولة.
                </p>
              </div>
              <div className="rounded-3xl bg-quran-100 p-6 shadow-sm text-right">
                <p className="text-sm text-quran-700">عدد الأبناء</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {dashboard.children.length}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 mb-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                التحضير المسبق لدرس اليوم
              </h2>
              <p className="text-sm text-slate-500">
                راجع خطة اليوم الخاصة بكل ابن قبل الحصة.
              </p>
            </div>
          </div>
          {todayLessonLoading ? (
            <p className="text-sm text-slate-600">جاري تحميل دروس اليوم...</p>
          ) : dashboard?.children?.length ? (
            <div className="space-y-4">
              {dashboard.children.map((child) => {
                const lessonInfo = todayLessons[child._id];
                return (
                  <div
                    key={child._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">الطالب</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          حلقة {child.group?.name || "غير محددة"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
                      {lessonInfo?.curriculum ? (
                        <>
                          <p className="text-sm text-slate-500">عنوان الدرس</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {lessonInfo.lesson?.title || "درس غير محدد"}
                          </p>
                          <p className="mt-3 text-slate-700">
                            {lessonInfo.lesson?.task || "لا توجد مهمة محددة."}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            {lessonInfo.lesson?.videoUrl ? (
                              <a
                                href={lessonInfo.lesson.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-3xl bg-quran-100 px-4 py-3 text-sm font-semibold text-quran-800 hover:bg-quran-200"
                              >
                                مشاهدة فيديو الدرس
                              </a>
                            ) : null}
                            {lessonInfo.lesson?.pdfUrl ? (
                              <a
                                href={lessonInfo.lesson.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-3xl bg-quran-100 px-4 py-3 text-sm font-semibold text-quran-800 hover:bg-quran-200"
                              >
                                تحميل / عرض PDF
                              </a>
                            ) : null}
                          </div>
                        </>
                      ) : child.group ? (
                        <p className="text-sm text-slate-600">
                          لم يتم تعيين منهج لهذه المجموعة بعد.
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600">
                          لم يتم تسجيل الطالب في حلقة بعد.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
              لا يوجد أبناء مسجلين بعد.
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">أبناؤك</h2>
              <p className="text-sm text-slate-500">
                اضغط على أي بطاقة لعرض سجل التقييمات المفصل.
              </p>
            </div>
          </div>

          {dashboard.children.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">
              لم يتم تسجيل أي أبناء بعد.
            </div>
          ) : (
            <>
              <div className="mb-4 overflow-x-auto pb-2">
                <div className="flex gap-2">
                  {dashboard.children.map((child) => (
                    <button
                      key={child._id}
                      type="button"
                      onClick={() => openChildModal(child)}
                      className={`flex-shrink-0 rounded-3xl border px-4 py-2 text-sm font-semibold transition ${
                        selectedChild?._id === child._id
                          ? "bg-quran-700 text-white border-quran-700"
                          : "bg-white text-slate-700 border-slate-200 hover:border-quran-300"
                      }`}
                    >
                      {child.firstName} {child.lastName}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {dashboard.children.map((child) => (
                  <article
                    key={child._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                  >
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-sm text-slate-500">الابن / الطالبة</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {child.firstName} {child.lastName}
                      </h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                        <p className="text-slate-500">المعلم</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {child.teacherId
                            ? `${child.teacherId.firstName} ${child.teacherId.lastName}`
                            : "غير محدد"}
                        </p>
                      </div>
                      <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                        <p className="text-slate-500">الحلقة</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {child.group ? child.group.name : "لم تسجل بعد"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-3xl bg-quran-100 px-4 py-2 text-sm font-semibold text-quran-800">
                        عدد التقييمات {child.evaluations.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => openChildModal(child)}
                        className="rounded-3xl bg-quran-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-quran-700"
                      >
                        عرض السجل
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <PointsSystemGuide />
        </section>
      </div>

      {selectedChild && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 px-4 py-8 sm:items-center sm:px-6 sm:py-12">
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl max-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-quran-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm">سجل تقييمات الطالب</p>
                <h3 className="text-xl font-semibold">
                  {selectedChild.firstName} {selectedChild.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeChildModal}
                className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              >
                إغلاق
              </button>
            </div>
            <div className="space-y-6 p-6 overflow-y-auto sm:p-8">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-700 shadow-sm">
                  <p className="text-slate-500">المعلم</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedChild.teacherId
                      ? `${selectedChild.teacherId.firstName} ${selectedChild.teacherId.lastName}`
                      : "غير محدد"}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-700 shadow-sm">
                  <p className="text-slate-500">الحلقة</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedChild.group
                      ? selectedChild.group.name
                      : "لم تسجل بعد"}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-700 shadow-sm">
                  <p className="text-slate-500">عدد التقييمات</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedChild.evaluations.length}
                  </p>
                </div>
              </div>

              {selectedChild.evaluations.length === 0 ? (
                <div className="rounded-3xl bg-slate-100 p-8 text-center text-slate-600">
                  لم يتم إضافة تقييمات بعد لهذا الطالب.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedChild.evaluations.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">التاريخ</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                            <p className="text-slate-500">التقييم</p>
                            <p className="mt-1 font-semibold">
                              {item.grade || "-"}
                            </p>
                          </div>
                          <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                            <p className="text-slate-500">عدد الأخطاء</p>
                            <p className="mt-1 font-semibold">
                              {item.mistakes}
                            </p>
                          </div>
                          <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                            <p className="text-slate-500">الحلقة</p>
                            <p className="mt-1 font-semibold">
                              {item.groupId?.name || "غير محددة"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                          <p className="font-semibold text-slate-800">
                            الحفظ الجديد
                          </p>
                          <p className="mt-2">
                            {item.newMemorization?.from || "-"} إلى{" "}
                            {item.newMemorization?.to || "-"}
                          </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                          <p className="font-semibold text-slate-800">
                            المراجعة
                          </p>
                          <p className="mt-2">
                            {item.revision?.from || "-"} إلى{" "}
                            {item.revision?.to || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-800">
                          ملاحظات المعلم
                        </p>
                        <p className="mt-2">
                          {item.notes || "لا توجد ملاحظات."}
                        </p>
                        {item.audioNote ? (
                          <audio
                            controls
                            src={item.audioNote}
                            className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 p-2"
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
