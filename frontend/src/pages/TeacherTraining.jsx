import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function TeacherTraining() {
  const [user, setUser] = useState(null);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));

    const load = async () => {
      try {
        setLoading(true);
        const resp = await api.get("/teacher/training/curriculums");
        setCurriculums(resp.data.curriculums || []);
      } catch (err) {
        console.error(err);
        setMessage("فشل تحميل الحقب التدريبية.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedCurriculumId) return;
    const loadCurrent = async () => {
      try {
        setLoading(true);
        const resp = await api.get(
          `/teacher/training/${selectedCurriculumId}/current`,
        );
        setProgress(resp.data.progress || null);
        setCurrentLesson(resp.data.lesson || null);
      } catch (err) {
        console.error(err);
        setMessage("فشل تحميل الدرس الحالي.");
      } finally {
        setLoading(false);
      }
    };
    loadCurrent();
  }, [selectedCurriculumId]);

  const handleComplete = async () => {
    if (!selectedCurriculumId) return;
    try {
      setBusy(true);
      const resp = await api.post(
        `/teacher/training/${selectedCurriculumId}/complete-lesson`,
      );
      setProgress(resp.data.progress || null);
      // optimistic update of local user points
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.points = (parsed.points || 0) + 50;
          localStorage.setItem("user", JSON.stringify(parsed));
          setUser(parsed);
        } catch (e) {
          console.warn("failed to update local user points", e);
        }
      }
      // reload current lesson
      const next = await api.get(
        `/teacher/training/${selectedCurriculumId}/current`,
      );
      setCurrentLesson(next.data.lesson || null);
      setMessage(resp.data.message || "تم إتمام الدرس.");
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || err.message || "فشل إتمام الدرس.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h1 className="text-3xl font-semibold">الحقيبة التدريبية للمعلمين</h1>
          <p className="mt-2 text-slate-600">
            تابع مسارك التدريبي ليتبع على الدرس الحالي وسجل إنجازه للتحصل على
            نقاط جيدة.
          </p>
        </header>

        {message && (
          <div className="rounded-3xl border border-quran-200 bg-quran-50 p-4 text-quran-900">
            {message}
          </div>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <label className="block text-sm text-slate-700">
            اختر الحقيبة التدريبية
          </label>
          <select
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
            value={selectedCurriculumId}
            onChange={(e) => setSelectedCurriculumId(e.target.value)}
          >
            <option value="">اختر حقيبة تدريبية</option>
            {curriculums.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          {loading ? (
            <div className="py-10 text-center text-slate-600">
              جاري التحميل...
            </div>
          ) : !selectedCurriculumId ? (
            <div className="py-10 text-center text-slate-600">
              اختر حقيبة لعرض الدرس الحالي.
            </div>
          ) : currentLesson ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{currentLesson.title}</h2>
              <p className="text-sm text-slate-600">{currentLesson.task}</p>
              {currentLesson.videoUrl && (
                <a
                  href={currentLesson.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-quran-700 font-semibold"
                >
                  مشاهدة الفيديو
                </a>
              )}
              {currentLesson.pdfUrl && (
                <a
                  href={currentLesson.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-quran-700 font-semibold"
                >
                  تحميل ملف PDF
                </a>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleComplete}
                  disabled={busy}
                  className="rounded-3xl bg-quran-700 px-6 py-2 text-sm font-semibold text-white hover:bg-quran-800 disabled:opacity-50"
                >
                  إتمام الدرس (يحصل على 50 نقطة)
                </button>
                <div className="text-sm text-slate-700">
                  الدرس {progress?.currentLessonIndex + 1} من{" "}
                  {progress?.totalLessons}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-600">
              لا يوجد درس حالياً لهذه الحقيبة.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
