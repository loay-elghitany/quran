import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";
import Navbar from "../components/Navbar";
import AnnouncementsBanner from "../components/AnnouncementsBanner";

const attendanceOptions = ["حاضر", "غائب بعذر", "غائب بدون عذر"];
const gradeOptions = ["ممتاز", "جيد جدًا", "جيد", "يحتاج مراجعة"];

const ticketTypeOptions = [
  { value: "Complaint", label: "شكوى" },
  { value: "Suggestion", label: "اقتراح" },
  { value: "Technical_Issue", label: "مشكلة تقنية" },
  { value: "Other", label: "أخرى" },
];

const ticketStatusMap = {
  Pending: {
    label: "قيد الانتظار",
    style: "bg-amber-100 text-amber-900",
    emoji: "🟡",
  },
  In_Progress: {
    label: "قيد التنفيذ",
    style: "bg-sky-100 text-sky-900",
    emoji: "🔵",
  },
  Resolved: {
    label: "تم الحل",
    style: "bg-emerald-100 text-emerald-900",
    emoji: "🟢",
  },
  Closed: {
    label: "مغلقة",
    style: "bg-slate-100 text-slate-900",
    emoji: "🛟",
  },
  "In Progress": {
    label: "قيد التنفيذ",
    style: "bg-sky-100 text-sky-900",
    emoji: "🔵",
  },
};

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
  const [complaintsModalOpen, setComplaintsModalOpen] = useState(false);
  const [userTickets, setUserTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [activeTicketTab, setActiveTicketTab] = useState(0);
  const [ticketType, setTicketType] = useState("Complaint");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketAnonymous, setTicketAnonymous] = useState(false);
  const [ticketSubmitLoading, setTicketSubmitLoading] = useState(false);
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
        // Prefer the new endpoint that includes evaluations per student
        const response = await api.get("/teacher/students-with-evaluations");
        setGroups(response.data.groups || []);
      } catch (error) {
        console.error("فشل تحميل بيانات اللوحة:", error);
        setToastMessage(getApiErrorMessage(error, "فشل تحميل بيانات الحلقة."));
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

  useEffect(() => {
    if (!complaintsModalOpen) return;

    const fetchMyTickets = async () => {
      setTicketsError("");
      setTicketsLoading(true);
      try {
        const response = await api.get("/tickets/my-tickets");
        setUserTickets(response.data.tickets || []);
      } catch (error) {
        console.error("فشل تحميل طلبات الشكاوى:", error);
        setTicketsError(getApiErrorMessage(error, "حدث خطأ أثناء جلب تذاكرك."));
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchMyTickets();
  }, [complaintsModalOpen]);

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
      setRecordingError("تعذر بدء التسجيل. يرجى التحقق من أذونات الميكروفون.");
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

  const handleSubmitTicket = async (event) => {
    event.preventDefault();
    setTicketsError("");

    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      setTicketsError("يرجى ملء الموضوع والوصف قبل الإرسال.");
      return;
    }

    setTicketSubmitLoading(true);
    try {
      await api.post("/tickets", {
        type: ticketType,
        subject: ticketSubject,
        description: ticketDescription,
        isAnonymous: ticketAnonymous,
        priority: "Low",
      });
      setTicketSubject("");
      setTicketDescription("");
      setTicketType("Complaint");
      setTicketAnonymous(false);
      setActiveTicketTab(1);
      const response = await api.get("/tickets/my-tickets");
      setUserTickets(response.data.tickets || []);
      window.alert(
        "تم إرسال الطلب بنجاح. يمكنك متابعة حالة التذكرة في طلباتي السابقة.",
      );
    } catch (error) {
      console.error("فشل إرسال الطلب:", error);
      setTicketsError(getApiErrorMessage(error, "حدث خطأ أثناء إرسال الطلب."));
    } finally {
      setTicketSubmitLoading(false);
    }
  };

  const closeComplaintsModal = () => {
    setComplaintsModalOpen(false);
    setActiveTicketTab(0);
    setTicketsError("");
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
      // Use embedded evaluations if available to avoid extra request
      if (student?.evaluations && student.evaluations.length > 0) {
        setHistoryItems(student.evaluations || []);
      } else {
        const response = await api.get(`/teacher/evaluations/${student._id}`);
        setHistoryItems(response.data?.evaluations || []);
      }
    } catch (error) {
      console.error("فشل تحميل سجل التقييم:", error);
      setHistoryError(
        getApiErrorMessage(error, "حدث خطأ أثناء تحميل سجل التقييمات."),
      );
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
            message: "فشل جلب بيانات الدرس لهذه الحلقة.",
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
      setAwardMessage("يرجى اختيار وسام أولًا.");
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
      setAwardMessage(getApiErrorMessage(error, "حدث خطأ أثناء منح الوسام."));
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
        getApiErrorMessage(error, "فشل الانتقال إلى الدرس التالي."),
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
      setToastMessage("يرجى اختيار طالب ومجموعة قبل حفظ التقييم.");
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
      setToastMessage("حدث خطأ أثناء حفظ التقييم. حاول مرة أخرى لاحقاً.");
    }
  };

  return (
    <div
      className="min-h-screen w-full min-w-0 bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="w-full max-w-full mx-auto px-4 py-6">
        <header className="mb-8 rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200 overflow-hidden">
          <AnnouncementsBanner />
          <div className="mt-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  لوحة تحكم المعلم
                </h1>
                <p className="mt-2 text-slate-600">
                  تحكم في مهام الطلاب وسجل تقييماتهم وراقب تقدمهم بسهولة.
                </p>
              </div>
              {user && (
                <div className="rounded-3xl bg-quran-100 px-5 py-4 text-right text-sm text-quran-900">
                  <p className="font-semibold">المعلم الحالي</p>
                  <p>{`${user.firstName} ${user.lastName}`}</p>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">الشكاوى والاقتراحات</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    إدارة طلبات الشكاوى والاقتراحات
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    افتح نافذة لتقديم طلب جديد أو عرض تذاكرك السابقة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setComplaintsModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-3xl bg-quran-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-quran-800"
                >
                  الشكاوى والاقتراحات
                </button>
              </div>
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
              عند إضافة حلقة جديدة سيتم عرضها هنا مع أزرار التقييم اليومي.
            </p>
          </div>
        ) : (
          <>
            {toastMessage && (
              <div className="fixed left-1/2 top-6 z-50 w-full max-w-md -translate-x-1/2 rounded-3xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-xl">
                {toastMessage}
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                          الانتقال إلى الدرس التالي
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
                      الطلاب في الحلقة (
                      {group?.students?.length ||
                        group?.studentIds?.length ||
                        0}
                      )
                    </p>
                    {(group?.students?.length ||
                      group?.studentIds?.length ||
                      0) === 0 ? (
                      <p className="text-sm text-slate-500">
                        لا يوجد طلاب مضافين لهذه الحلقة.
                      </p>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <ul className="min-w-full space-y-4">
                          {(group?.students || group?.studentIds || []).map(
                            (student) => {
                              return (
                                <li
                                  key={student._id}
                                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div>
                                    <p className="text-base font-semibold text-slate-900">
                                      {student.firstName} {student.lastName}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      طالب في الحلقة {group.name}
                                    </p>
                                  </div>
                                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full bg-quran-100 px-3 py-2 text-xs font-semibold text-quran-800">
                                        الأوسمة: {student.badges?.length || 0}
                                      </span>
                                      <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                                        سلسلة:{" "}
                                        {student.evaluationStreak?.count || 0}
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
                                        إضافة تقييم يومي
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openHistoryModal(student)
                                        }
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
                              );
                            },
                          )}
                        </ul>
                      </div>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
                    className="mt-2 w-full sm:w-auto rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    {attendanceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-red-600">
                    * ملاحظة: تسجيل الطالب قد يستغرق حتى 20 دقيقة من تحديثه.
                  </p>
                </label>
                <label className="block text-sm text-slate-700">
                  التقييم العام
                  <select
                    value={evaluation.grade}
                    onChange={(e) =>
                      handleEvaluationChange("grade", e.target.value)
                    }
                    className="mt-2 w-full sm:w-auto rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
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
                    placeholder="مثال: الناس"
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
                    placeholder="أضف ملاحظة قصيرة لولي الأمر"
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
                          بدء التسجيل
                        </button>
                      )}
                      {isRecording && (
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          إيقاف التسجيل
                        </button>
                      )}
                      {(recordedAudioUrl || recordingError) && (
                        <button
                          type="button"
                          onClick={cleanupRecording}
                          className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          حذف / إعادة تسجيل
                        </button>
                      )}
                    </div>
                  </div>

                  {isRecording && (
                    <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">
                      يتم التسجيل الآن... يمكنك التحدث عبر الميكروفون.
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
                ملاحظة صوتية (اختياري)
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

      {complaintsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  الشكاوى والاقتراحات
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  أنشئ طلباً جديداً أو راجع طلباتك السابقة مع الردود.
                </p>
              </div>
              <button
                type="button"
                onClick={closeComplaintsModal}
                className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                إغلاق
              </button>
            </div>

            <div className="mt-6">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setActiveTicketTab(0)}
                  className={`flex-1 w-full sm:w-auto rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTicketTab === 0
                      ? "bg-quran-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  تقديم طلب جديد
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTicketTab(1)}
                  className={`flex-1 w-full sm:w-auto rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTicketTab === 1
                      ? "bg-quran-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  طلباتي السابقة
                </button>
              </div>

              {activeTicketTab === 0 ? (
                <form onSubmit={handleSubmitTicket} className="mt-6 space-y-5">
                  {ticketsError ? (
                    <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">
                      {ticketsError}
                    </div>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      نوع الطلب
                      <select
                        value={ticketType}
                        onChange={(event) => setTicketType(event.target.value)}
                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-quran-500"
                      >
                        {ticketTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      الموضوع
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(event) =>
                          setTicketSubject(event.target.value)
                        }
                        placeholder="اكتب عنوانًا موجزًا للطلب"
                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-quran-500"
                      />
                    </label>
                  </div>
                  <label className="space-y-2 text-sm text-slate-700">
                    وصف كامل
                    <textarea
                      value={ticketDescription}
                      onChange={(event) =>
                        setTicketDescription(event.target.value)
                      }
                      rows={5}
                      placeholder="اشرح تفاصيل الطلب أو الشكوى بدقة"
                      className="w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-quran-500"
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={ticketAnonymous}
                      onChange={(event) =>
                        setTicketAnonymous(event.target.checked)
                      }
                      className="h-5 w-5 rounded border-slate-300 text-quran-700 focus:ring-quran-500"
                    />
                    إرسال كمجهول
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-slate-500">
                      سيتم حفظ الحالة كـ "قيد الانتظار" حتى يرد أحد الموظفين.
                    </span>
                    <button
                      type="submit"
                      disabled={ticketSubmitLoading}
                      className="inline-flex items-center justify-center rounded-3xl bg-quran-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-quran-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {ticketSubmitLoading ? "جارٍ الإرسال..." : "إرسال الطلب"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 space-y-4">
                  {ticketsLoading ? (
                    <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-600">
                      جاري تحميل طلباتك...
                    </div>
                  ) : userTickets.length === 0 ? (
                    <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-600">
                      لم تقم بتقديم أي شكاوى أو اقتراحات حتى الآن.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userTickets.map((ticket) => {
                        const statusInfo = ticketStatusMap[ticket.status] ||
                          ticketStatusMap[
                            ticket.status?.replace(/\s+/g, "_")
                          ] || {
                            label: ticket.status || "غير محدد",
                            style: "bg-slate-100 text-slate-900",
                            emoji: "ℹ️",
                          };
                        return (
                          <div
                            key={ticket._id}
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm text-slate-500">
                                  الموضوع
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                  {ticket.subject}
                                </p>
                                <p className="mt-3 text-sm text-slate-600">
                                  {ticketTypeOptions.find(
                                    (option) => option.value === ticket.type,
                                  )?.label || ticket.type}{" "}
                                  · {formatDate(ticket.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusInfo.style}`}
                              >
                                <span>{statusInfo.emoji}</span>
                                <span>{statusInfo.label}</span>
                              </span>
                            </div>
                            <div className="mt-4 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                              <p className="font-semibold text-slate-900">
                                الوصف
                              </p>
                              <p className="mt-2 whitespace-pre-line">
                                {ticket.description || "لا يوجد وصف إضافي."}
                              </p>
                            </div>
                            {(ticket.adminReply ||
                              (ticket.replies?.length > 0 &&
                                ticket.replies[0]?.message)) && (
                              <div className="mt-4 rounded-3xl border-l-4 border-quran-600 bg-quran-50 p-4 text-sm text-slate-700">
                                <p className="text-sm font-semibold text-slate-900">
                                  رد الإدارة
                                </p>
                                <p className="mt-2">
                                  {ticket.adminReply ||
                                    ticket.replies[0]?.message}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {badgeModalOpen && selectedBadgeStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
                  والتحقق من تسجيله الجديد.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {badges.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
                    لا توجد أوسمة متاحة حالياً.
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
