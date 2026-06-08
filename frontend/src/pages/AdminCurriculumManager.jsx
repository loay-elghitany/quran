import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";
import Navbar from "../components/Navbar";

const emptyLesson = { title: "", task: "", pdfUrl: "", videoUrl: "" };
const initialCurriculum = {
  _id: "",
  name: "",
  description: "",
  lessons: [],
  target: "student",
};

export default function AdminCurriculumManager() {
  const [user, setUser] = useState(null);
  const [curriculums, setCurriculums] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeCurriculum, setActiveCurriculum] = useState(initialCurriculum);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lessonFile, setLessonFile] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [currResponse, groupResponse] = await Promise.all([
          api.get("/admin/curriculums"),
          api.get("/admin/groups"),
        ]);
        setCurriculums(currResponse.data.curriculums || []);
        setGroups(groupResponse.data.groups || []);
      } catch (error) {
        console.error(error);
        setMessage("فشل تحميل بيانات المناهج أو المجموعات.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const resetForm = () => {
    setActiveCurriculum(initialCurriculum);
    setSelectedLessonIndex(null);
    setLessonFile(null);
    setMessage("");
  };

  const handleCurriculumChange = (field, value) => {
    setActiveCurriculum((prev) => ({ ...prev, [field]: value }));
  };

  const handleLessonChange = (field, value) => {
    if (selectedLessonIndex === null) return;
    setActiveCurriculum((prev) => {
      const lessons = [...prev.lessons];
      lessons[selectedLessonIndex] = {
        ...lessons[selectedLessonIndex],
        [field]: value,
      };
      return { ...prev, lessons };
    });
  };

  const addLesson = () => {
    setActiveCurriculum((prev) => ({
      ...prev,
      lessons: [...prev.lessons, { ...emptyLesson }],
    }));
    setSelectedLessonIndex(activeCurriculum.lessons.length);
  };

  const removeLesson = (index) => {
    setActiveCurriculum((prev) => {
      const lessons = [...prev.lessons];
      lessons.splice(index, 1);
      return { ...prev, lessons };
    });
    setSelectedLessonIndex(null);
  };

  const editCurriculum = (curriculum) => {
    setActiveCurriculum({
      _id: curriculum._id,
      name: curriculum.name || "",
      description: curriculum.description || "",
      lessons: curriculum.lessons || [],
      target: curriculum.target || "student",
    });
    setSelectedLessonIndex(null);
    setLessonFile(null);
    setMessage("");
  };

  const uploadPdf = async (file) => {
    const formData = new FormData();
    formData.append("pdf", file);
    const response = await api.post("/admin/curriculums/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.pdfUrl;
  };

  const handleLessonFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLessonFile(file);
    try {
      const pdfUrl = await uploadPdf(file);
      handleLessonChange("pdfUrl", pdfUrl);
      setMessage("تم رفع ملف PDF بنجاح.");
    } catch (error) {
      console.error(error);
      setMessage(
        getApiErrorMessage(
          error,
          "فشل رفع ملف PDF. تحقق من نوع الملف وحاول مرة أخرى.",
        ),
      );
    }
  };

  const saveCurriculum = async (event) => {
    event.preventDefault();
    if (!activeCurriculum.name.trim()) {
      setMessage("يرجى إدخال اسم المنهج.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: activeCurriculum.name,
        description: activeCurriculum.description,
        target: activeCurriculum.target || "student",
        lessons: activeCurriculum.lessons,
      };

      if (activeCurriculum._id) {
        await api.put(`/admin/curriculums/${activeCurriculum._id}`, payload);
        setMessage("تم تحديث المنهج بنجاح.");
      } else {
        await api.post(`/admin/curriculums`, payload);
        setMessage("تم إضافة المنهج بنجاح.");
      }

      const resp = await api.get("/admin/curriculums");
      setCurriculums(resp.data.curriculums || []);
      resetForm();
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, "فشل حفظ المنهج."));
    } finally {
      setSaving(false);
    }
  };

  const assignCurriculum = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedCurriculumId) {
      setMessage("يرجى اختيار المجموعة والمنهج.");
      return;
    }

    try {
      await api.put(`/admin/groups/${selectedGroupId}/assign-curriculum`, {
        curriculumId: selectedCurriculumId,
      });
      setMessage("تم تعيين المنهج للمجموعة بنجاح.");
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, "فشل تعيين المنهج للمجموعة."));
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h1 className="text-3xl font-semibold text-slate-900">
            إدارة المناهج والمسارات الدراسية
          </h1>
          <p className="mt-3 text-slate-600">
            أنشئ المناهج، أضف الدروس ووزع المناهج على المجموعات بسهولة.
          </p>
        </header>

        {message && (
          <div className="rounded-3xl border border-quran-200 bg-quran-50 p-4 text-quran-900">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              إنشاء / تعديل منهج
            </h2>
            <form className="space-y-5" onSubmit={saveCurriculum}>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  اسم المنهج
                  <input
                    value={activeCurriculum.name}
                    onChange={(e) =>
                      handleCurriculumChange("name", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    placeholder="مثلاً: منهج التحضير الأول"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  وصف المنهج
                  <input
                    value={activeCurriculum.description}
                    onChange={(e) =>
                      handleCurriculumChange("description", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    placeholder="ملخص قصير عن المنهج"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  الفئة المستهدفة
                  <select
                    value={activeCurriculum.target}
                    onChange={(e) =>
                      handleCurriculumChange("target", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="student">منهج للطلاب</option>
                    <option value="teacher">حقيبة تدريبية للمعلمين</option>
                  </select>
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    الدروس
                  </h3>
                  <button
                    type="button"
                    onClick={addLesson}
                    className="rounded-3xl bg-quran-700 px-4 py-2 text-sm font-semibold text-white hover:bg-quran-800"
                  >
                    إضافة درس جديد
                  </button>
                </div>

                {activeCurriculum.lessons.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
                    لم يتم إضافة دروس إلى المنهج.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeCurriculum.lessons.map((lesson, index) => (
                      <div
                        key={index}
                        className={`rounded-3xl border p-4 shadow-sm ${
                          selectedLessonIndex === index
                            ? "border-quran-500 bg-quran-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-slate-500">
                              درس {index + 1}
                            </p>
                            <p className="font-semibold text-slate-900">
                              {lesson.title || "عنوان الدرس"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedLessonIndex(index)}
                              className="rounded-2xl border border-quran-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              تحرير
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLesson(index)}
                              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                            >
                              حذف
                            </button>
                          </div>
                        </div>

                        {selectedLessonIndex === index && (
                          <div className="mt-4 grid gap-4">
                            <label className="block text-sm text-slate-700">
                              عنوان الدرس
                              <input
                                value={lesson.title}
                                onChange={(e) =>
                                  handleLessonChange("title", e.target.value)
                                }
                                className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                                placeholder="مثلاً: درس الحفظ الأول"
                              />
                            </label>
                            <label className="block text-sm text-slate-700">
                              المحتوى / النشاط
                              <textarea
                                value={lesson.task}
                                onChange={(e) =>
                                  handleLessonChange("task", e.target.value)
                                }
                                className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                                rows={4}
                                placeholder="اكتب وصف الدرس أو النشاط هنا"
                              />
                            </label>
                            <div className="grid gap-4 lg:grid-cols-2">
                              <label className="block text-sm text-slate-700">
                                رابط الفيديو (يوتيوب)
                                <input
                                  value={lesson.videoUrl}
                                  onChange={(e) =>
                                    handleLessonChange(
                                      "videoUrl",
                                      e.target.value,
                                    )
                                  }
                                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                                  placeholder="https://youtube.com/..."
                                />
                              </label>
                              <label className="block text-sm text-slate-700">
                                رفع ملف PDF
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={handleLessonFile}
                                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                                />
                              </label>
                            </div>
                            {lesson.pdfUrl && (
                              <p className="text-sm text-quran-700">
                                الملف الحالي:{" "}
                                <a
                                  href={lesson.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold underline"
                                >
                                  عرض PDF
                                </a>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-3xl bg-quran-700 px-6 py-3 text-sm font-semibold text-white hover:bg-quran-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {activeCurriculum._id ? "تحديث المنهج" : "حفظ المنهج"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-3xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إعادة تعيين النموذج
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              تعيين المنهج للمجموعة
            </h2>

            <form className="space-y-4" onSubmit={assignCurriculum}>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  اختر المجموعة
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="">اختر المجموعة</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-700">
                  اختر المنهج
                  <select
                    value={selectedCurriculumId}
                    onChange={(e) => setSelectedCurriculumId(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="">اختر المنهج</option>
                    {curriculums.map((curriculum) => (
                      <option key={curriculum._id} value={curriculum._id}>
                        {curriculum.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="submit"
                className="rounded-3xl bg-quran-700 px-6 py-3 text-sm font-semibold text-white hover:bg-quran-800"
              >
                تعيين المنهج للمجموعة
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              قائمة المناهج
            </h2>
            <p className="text-sm text-slate-500">
              عرض سريع للمناهج المسجلة وتفاصيلها.
            </p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-slate-600">
              جارٍ التحميل...
            </div>
          ) : curriculums.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-slate-600">
              لا توجد مناهج مسجلة بعد.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {curriculums.map((curriculum) => (
                <article
                  key={curriculum._id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {curriculum.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {curriculum.description || "بدون وصف"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => editCurriculum(curriculum)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      تعديل المنهج
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-sm text-slate-500">عدد الدروس</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {curriculum.lessons.length}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-sm text-slate-500">آخر درس</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {curriculum.lessons.length > 0
                          ? curriculum.lessons[curriculum.lessons.length - 1]
                              .title
                          : "لا يوجد درس"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
