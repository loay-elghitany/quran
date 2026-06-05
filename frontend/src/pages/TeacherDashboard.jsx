import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import AnnouncementsBanner from "../components/AnnouncementsBanner";

const attendanceOptions = ["حاضر", "غائب", "متأخر"];
const gradeOptions = ["ممتاز", "جيد جداً", "جيد", "يحتاج مراجعة"];

const defaultEvaluation = {
  attendanceStatus: "حاضر",
  memorizationFrom: "",
  memorizationTo: "",
  revisionFrom: "",
  revisionTo: "",
  mistakes: 0,
  grade: "ممتاز",
  notes: "",
};

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [evaluation, setEvaluation] = useState(defaultEvaluation);
  const [statusMessage, setStatusMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [currentLessons, setCurrentLessons] = useState({});
  const [groupLessonLoading, setGroupLessonLoading] = useState({});
  const [lessonActionMessage, setLessonActionMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordingError, setRecordingError] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [badges, setBadges] = useState([]);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [selectedBadgeStudent, setSelectedBadgeStudent] = useState(null);
  const [awardMessage, setAwardMessage] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get("/teacher/dashboard");
        setGroups(response.data.groups || []);
      } catch (error) {
        console.error("فشل تحميل بيانات الحلقة:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const openEvaluationModal = (student, group) => {
    cleanupRecording();
    setSelectedStudent(student);
    setSelectedGroup(group);
    setEvaluation(defaultEvaluation);
    setModalOpen(true);
    setStatusMessage("");
  };

  const closeModal = () => {
    cleanupRecording();
    setModalOpen(false);
    setSelectedStudent(null);
    setSelectedGroup(null);
  };

  const cleanupRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    recordedChunksRef.current = [];
    setIsRecording(false);
    setRecordingError("");
  };

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalOpen]);

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("هذا المتصفح لا يدعم التسجيل الصوتي.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];
      setRecordingError("");

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
        }
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: recordedChunksRef.current[0]?.type || "audio/webm",
        });
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setRecordingError("تعذر بدء التسجيل. تحقق من أذونات الميكروفون.");
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleEvaluationChange = (field, value) => {
    setEvaluation((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (isoDate) => {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDate));
  };

  const openHistoryModal = async (student) => {
    setHistoryOpen(true);
    setHistoryStudent(student);
    setHistoryItems([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const response = await api.get(`/teacher/evaluations/${student._id}`);
      setHistoryItems(response.data.evaluations || []);
    } catch (error) {
      console.error("فشل تحميل سجل التقييم:", error);
      setHistoryError("حدث خطأ أثناء تحميل سجل التقييمات.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCurrentLessons = async () => {
    const lessonsByGroup = {};
    await Promise.all(
      groups.map(async (group) => {
        try {
          const response = await api.get(`/groups/${group._id}/current-lesson`);
          lessonsByGroup[group._id] = response.data;
        } catch (error) {
          lessonsByGroup[group._id] = {
            group,
            lesson: null,
            message: "فشل جلب خطة اليوم لهذه المجموعة.",
          };
        }
      }),
    );
    setCurrentLessons(lessonsByGroup);
  };

  useEffect(() => {
    if (groups.length > 0) {
      fetchCurrentLessons();
    }
  }, [groups]);

  const loadBadges = async () => {
    try {
      const response = await api.get("/teacher/badges");
      setBadges(response.data.badges || []);
    } catch (error) {
      console.error("فشل تحميل الأوسمة:", error);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const openBadgeModal = (student) => {
    setSelectedBadgeStudent(student);
    setSelectedBadge("");
    setBadgeModalOpen(true);
    setAwardMessage("");
  };

  const closeBadgeModal = () => {
    setBadgeModalOpen(false);
    setSelectedBadgeStudent(null);
    setSelectedBadge("");
  };

  const handleAwardBadge = async () => {
    if (!selectedBadge || !selectedBadgeStudent) {
      setAwardMessage("يرجى اختيار وسام أولاً.");
      return;
    }

    try {
      await api.post(
        `/teacher/students/${selectedBadgeStudent._id}/award-badge`,
        { badgeId: selectedBadge },
      );
      setAwardMessage("تم منح الوسام بنجاح.");
      loadBadges();
      setTimeout(() => setAwardMessage(""), 4000);
      closeBadgeModal();
      const response = await api.get("/teacher/dashboard");
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error("فشل منح الوسام:", error);
      setAwardMessage(
        error.response?.data?.message || "حدث خطأ أثناء منح الوسام.",
      );
    }
  };

  const handleAdvanceLesson = async (groupId) => {
    setGroupLessonLoading((prev) => ({ ...prev, [groupId]: true }));
    setLessonActionMessage("");

    try {
      const response = await api.post(
        `/teacher/groups/${groupId}/advance-lesson`,
      );
      setCurrentLessons((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          group: response.data.group,
          lesson: response.data.lesson,
          currentLessonIndex: response.data.currentLessonIndex,
          totalLessons: response.data.totalLessons,
          curriculum:
            prev[groupId]?.curriculum || response.data.group.curriculumId,
        },
      }));
      setLessonActionMessage("تم الانتقال إلى الدرس التالي بنجاح.");
    } catch (error) {
      console.error("Failed to advance lesson:", error);
      setLessonActionMessage(
        error.response?.data?.message || "فشل الانتقال إلى الدرس التالي.",
      );
    } finally {
      setGroupLessonLoading((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const closeHistoryModal = () => {
    setHistoryOpen(false);
    setHistoryStudent(null);
    setHistoryItems([]);
    setHistoryError("");
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedGroup) {
      setToastMessage("يرجى اختيار طالب وحلقة قبل حفظ التقييم.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("studentId", selectedStudent._id);
      formData.append("groupId", selectedGroup._id);
      formData.append("attendanceStatus", evaluation.attendanceStatus);
      formData.append("memorizationFrom", evaluation.memorizationFrom);
      formData.append("memorizationTo", evaluation.memorizationTo);
      formData.append("revisionFrom", evaluation.revisionFrom);
      formData.append("revisionTo", evaluation.revisionTo);
      formData.append("mistakes", evaluation.mistakes);
      formData.append("grade", evaluation.grade);
      formData.append("notes", evaluation.notes);

      if (audioFile) {
        formData.append("audioNote", audioFile);
      } else if (recordedChunksRef.current.length > 0) {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: recordedChunksRef.current[0]?.type || "audio/webm",
        });
        formData.append(
          "audioNote",
          new File([audioBlob], "evaluation-audio.webm", {
            type: audioBlob.type,
          }),
        );
      }

      await api.post("/teacher/evaluations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToastMessage("تم حفظ التقييم اليومي بنجاح.");
      setEvaluation(defaultEvaluation);
      cleanupRecording();
      closeModal();
      setTimeout(() => setToastMessage(""), 4000);
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      setToastMessage("حدث خطأ أثناء حفظ التقييم. حاول مرة أخرى لاحقًا.");
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8 rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <AnnouncementsBanner />
          <div className="mt-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  لوحة تحكم المعلم
                </h1>
                <p className="mt-2 text-slate-600">
                  عرض المجموعات، إدارة الطلاب، وإضافة تقييمات يومية بسهولة.
                </p>
              </div>
              {user && (
                <div className="rounded-3xl bg-quran-100 px-5 py-4 text-right text-sm text-quran-900">
                  <p className="font-semibold">المعلم الحالي</p>
                  <p>{`${user.firstName} ${user.lastName}`}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-quran-600 border-t-transparent"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              لا توجد حلقات بعد
            </h2>
            <p className="text-slate-600">
              عندما تُنشىء حلقة جديدة، ستظهر هنا قائمة الطلاب مع أزرار التقييم
              اليومية.
            </p>
          </div>
        ) : (
          <>
            {toastMessage && (
              <div className="fixed left-1/2 top-6 z-50 w-full max-w-md -translate-x-1/2 rounded-3xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-xl">
                {toastMessage}
              </div>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              {groups.map((group) => (
                <section
                  key={group._id}
                  className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm"
                >
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">اسم الحلقة</p>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        {group.name}
                      </h2>
                    </div>
                    <span className="inline-flex rounded-full bg-quran-100 px-4 py-2 text-sm font-semibold text-quran-800">
                      المعلم:{" "}
                      {user ? `${user.firstName} ${user.lastName}` : "غير محدد"}
                    </span>
                  </div>

                  <div className="mb-6 rounded-3xl bg-quran-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">خطة اليوم</p>
                        {currentLessons[group._id]?.curriculum ? (
                          <>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">
                              {currentLessons[group._id]?.lesson?.title ||
                                "درس غير محدد"}
                            </h3>
                            <p className="mt-3 text-sm text-slate-700">
                              {currentLessons[group._id]?.lesson?.task ||
                                "لا توجد مهمة محددة لهذا الدرس."}
                            </p>
                          </>
                        ) : currentLessons[group._id]?.message ? (
                          <p className="mt-2 text-sm text-slate-700">
                            {currentLessons[group._id].message}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-slate-700">
                            جاري تحميل خطة اليوم...
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 sm:items-end">
                        {currentLessons[group._id]?.lesson?.videoUrl ? (
                          <a
                            href={currentLessons[group._id].lesson.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-quran-700 shadow-sm hover:bg-slate-100"
                          >
                            مشاهدة فيديو الدرس
                          </a>
                        ) : null}
                        {currentLessons[group._id]?.lesson?.pdfUrl ? (
                          <a
                            href={currentLessons[group._id].lesson.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-quran-700 shadow-sm hover:bg-slate-100"
                          >
                            تحميل / عرض PDF
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleAdvanceLesson(group._id)}
                          disabled={
                            groupLessonLoading[group._id] ||
                            !currentLessons[group._id]?.lesson ||
                            currentLessons[group._id]?.currentLessonIndex >=
                              currentLessons[group._id]?.totalLessons - 1
                          }
                          className="rounded-3xl bg-quran-700 px-4 py-3 text-sm font-semibold text-white hover:bg-quran-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          إنهاء الدرس والانتقال للتالي
                        </button>
                      </div>
                    </div>
                    {lessonActionMessage && (
                      <p className="mt-4 text-sm text-emerald-700">
                        {lessonActionMessage}
                      </p>
                    )}
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="mb-4 text-sm font-medium text-slate-700">
                      الطلاب في الحلقة ({group.studentIds.length})
                    </p>
                    {group.studentIds.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        لا يوجد طلاب مضافين لهذه الحلقة.
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {group.studentIds.map((student) => (
                          <li
                            key={student._id}
                            className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-base font-semibold text-slate-900">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-slate-500">
                                طالب في حلقة {group.name}
                              </p>
                            </div>
                            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-quran-100 px-3 py-2 text-xs font-semibold text-quran-800">
                                  الأوسمة: {student.badges?.length || 0}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                                  سلسلة: {student.evaluationStreak?.count || 0}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEvaluationModal(student, group)
                                  }
                                  className="inline-flex items-center justify-center rounded-2xl bg-quran-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-quran-700"
                                >
                                  إضافة تقييم اليوم
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openHistoryModal(student)}
                                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  سجل التقييمات
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openBadgeModal(student)}
                                  className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                                >
                                  منح وسام
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        {statusMessage && (
          <div className="mt-6 rounded-3xl bg-emerald-100 px-6 py-4 text-slate-800 shadow-sm">
            {statusMessage}
          </div>
        )}
      </div>

      {modalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-quran-600 px-6 py-5 text-white">
              <div>
                <p className="text-sm">إضافة تقييم يومي</p>
                <h3 className="text-xl font-semibold">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              >
                إغلاق
              </button>
            </div>
            <form className="space-y-6 p-6" onSubmit={handleEvaluationSubmit}>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  حالة الحضور
                  <select
                    value={evaluation.attendanceStatus}
                    onChange={(e) =>
                      handleEvaluationChange("attendanceStatus", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    {attendanceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-red-600">
                    * ملاحظة: تسجيل الطالب كغائب سيخصم 20 نقطة من رصيده
                    التراكمي.
                  </p>
                </label>
                <label className="block text-sm text-slate-700">
                  التقييم العام
                  <select
                    value={evaluation.grade}
                    onChange={(e) =>
                      handleEvaluationChange("grade", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    {gradeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  سورة من
                  <input
                    value={evaluation.memorizationFrom}
                    onChange={(e) =>
                      handleEvaluationChange("memorizationFrom", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    placeholder="مثال: الفاتحة"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  سورة إلى
                  <input
                    value={evaluation.memorizationTo}
                    onChange={(e) =>
                      handleEvaluationChange("memorizationTo", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    placeholder="مثال: البقرة"
                  />
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  مراجعة من
                  <input
                    value={evaluation.revisionFrom}
                    onChange={(e) =>
                      handleEvaluationChange("revisionFrom", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    placeholder="مثال: آل عمران"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  مراجعة إلى
                  <input
                    value={evaluation.revisionTo}
                    onChange={(e) =>
                      handleEvaluationChange("revisionTo", e.target.value)
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    placeholder="مثال: النساء"
                  />
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  عدد الأخطاء
                  <input
                    type="number"
                    min={0}
                    value={evaluation.mistakes}
                    onChange={(e) =>
                      handleEvaluationChange("mistakes", Number(e.target.value))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  ملاحظات ولي الأمر
                  <textarea
                    value={evaluation.notes}
                    onChange={(e) =>
                      handleEvaluationChange("notes", e.target.value)
                    }
                    rows={3}
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    placeholder="أضف ملاحظة قصيرة لأولياء الأمور"
                  />
                </label>

                <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        التسجيل الصوتي
                      </p>
                      <p className="text-sm text-slate-500">
                        اضغط لبدء التسجيل ثم أوقفه للاستماع.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {!isRecording && (
                        <button
                          type="button"
                          onClick={handleStartRecording}
                          className="rounded-3xl bg-quran-600 px-4 py-3 text-sm font-semibold text-white hover:bg-quran-700"
                        >
                          بدء التسجيل 🎙️
                        </button>
                      )}
                      {isRecording && (
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          إيقاف التسجيل ⏹️
                        </button>
                      )}
                      {(recordedAudioUrl || recordingError) && (
                        <button
                          type="button"
                          onClick={cleanupRecording}
                          className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          حذف / إعادة تسجيل 🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {isRecording && (
                    <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">
                      يتم التسجيل الآن... تأكد من التحدث بالقرب من الميكروفون.
                    </div>
                  )}

                  {recordingError && (
                    <p className="text-sm text-rose-600">{recordingError}</p>
                  )}

                  {recordedAudioUrl && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900">
                        معاينة التسجيل
                      </p>
                      <audio
                        controls
                        src={recordedAudioUrl}
                        className="w-full rounded-3xl border border-slate-300 bg-white p-3"
                      />
                    </div>
                  )}
                </div>
              </div>
              <label className="block text-sm text-slate-700">
                ملاحظة صوتية (اختيارية)
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files[0] || null)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                />
              </label>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-3xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-quran-700"
                >
                  حفظ التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {badgeModalOpen && selectedBadgeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-orange-500 px-6 py-5 text-white">
              <div>
                <p className="text-sm">منح وسام</p>
                <h3 className="text-xl font-semibold">
                  {selectedBadgeStudent.firstName}{" "}
                  {selectedBadgeStudent.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeBadgeModal}
                className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              >
                إغلاق
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  اختر وسامًا من القائمة التالية لمنح الطالب نقاطًا إضافية
                  وتحفيزًا جديدًا.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {badges.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
                    لا توجد أوسمة متاحة حاليًا.
                  </div>
                ) : (
                  badges.map((badge) => (
                    <button
                      key={badge._id}
                      type="button"
                      onClick={() => setSelectedBadge(badge._id)}
                      className={`rounded-3xl border p-4 text-right transition ${
                        selectedBadge === badge._id
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-quran-100 text-2xl">
                          {badge.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {badge.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                        <span>نقاط: {badge.pointsReward}</span>
                        <span>حد: {badge.maxPerMonth}/شهر</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {awardMessage ? (
                <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">
                  {awardMessage}
                </div>
              ) : null}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeBadgeModal}
                  className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleAwardBadge}
                  className="rounded-3xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  منح الوسام
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyOpen && historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-quran-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm">سجل تقييمات الطالب</p>
                <h3 className="text-xl font-semibold">
                  {historyStudent.firstName} {historyStudent.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeHistoryModal}
                className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              >
                إغلاق
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-6">
              {historyLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-quran-600 border-t-transparent"></div>
                </div>
              ) : historyError ? (
                <div className="rounded-3xl bg-rose-50 p-6 text-rose-700">
                  {historyError}
                </div>
              ) : historyItems.length === 0 ? (
                <div className="rounded-3xl bg-slate-100 p-8 text-center text-slate-600">
                  لم يتم إضافة تقييمات بعد لهذا الطالب.
                </div>
              ) : (
                <ul className="space-y-4">
                  {historyItems.map((item) => (
                    <li
                      key={item._id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            التاريخ
                          </p>
                          <p className="text-base font-semibold text-slate-900">
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                            <p className="text-slate-500">التقييم</p>
                            <p className="mt-1 font-semibold">{item.grade}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                            <p className="text-slate-500">عدد الأخطاء</p>
                            <p className="mt-1 font-semibold">
                              {item.mistakes}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                            <p className="text-slate-500">الحلقة</p>
                            <p className="mt-1 font-semibold">
                              {item.groupId?.name || "غير محددة"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                          <p className="font-semibold text-slate-800">
                            الحفظ الجديد
                          </p>
                          <p>
                            {item.newMemorization?.from || "-"} إلى{" "}
                            {item.newMemorization?.to || "-"}
                          </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                          <p className="font-semibold text-slate-800">
                            المراجعة
                          </p>
                          <p>
                            {item.revision?.from || "-"} إلى{" "}
                            {item.revision?.to || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-800">
                          ملاحظات ولي الأمر
                        </p>
                        <p>{item.notes || "لا توجد ملاحظات."}</p>
                        {item.audioNote ? (
                          <audio
                            controls
                            src={item.audioNote}
                            className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 p-2"
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
