import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import api from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";
import Navbar from "../components/Navbar";
import AnnouncementsBanner from "../components/AnnouncementsBanner";
import PointsSystemGuide from "../components/PointsSystemGuide";

const rankConfig = [
  {
    name: "قارئ صاعد 🌱",
    icon: "🌱",
    min: 0,
    max: 249,
    milestoneCap: 250,
    nextLabel: "مُرَتِّل مُواظِب ✨",
  },
  {
    name: "مُرَتِّل مُواظِب ✨",
    icon: "✨",
    min: 250,
    max: 549,
    milestoneCap: 550,
    nextLabel: "حافظ مجتهد 🛡️",
  },
  {
    name: "حافظ مجتهد 🛡️",
    icon: "🛡️",
    min: 550,
    max: 849,
    milestoneCap: 850,
    nextLabel: "متميز الهمة 💎",
  },
  {
    name: "متميز الهمة 💎",
    icon: "💎",
    min: 850,
    max: 1149,
    milestoneCap: 1150,
    nextLabel: "سفير القرآن 👑",
  },
  {
    name: "سفير القرآن 👑",
    icon: "👑",
    min: 1150,
    max: null,
    milestoneCap: 1250,
    nextLabel: null,
  },
];

const getRankInfo = (points) => {
  return (
    rankConfig.find((rank) => {
      if (rank.max === null) return points >= rank.min;
      return points >= rank.min && points <= rank.max;
    }) || rankConfig[0]
  );
};

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

const formatDate = (isoDate) => {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
};

const getTicketTypeLabel = (type) =>
  ticketTypeOptions.find((option) => option.value === type)?.label ||
  type ||
  "أخرى";

const getTicketStatusInfo = (status) =>
  ticketStatusMap[status] ||
  ticketStatusMap[status?.replace(/\s+/g, "_")] || {
    label: status || "غير محدد",
    style: "bg-slate-100 text-slate-900",
    emoji: "ℹ️",
  };

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [todayLesson, setTodayLesson] = useState(null);
  const [todayLessonLoading, setTodayLessonLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availablePoints, setAvailablePoints] = useState(null);
  const [totalPoints, setTotalPoints] = useState(null);
  const [reservedPoints, setReservedPoints] = useState(0);
  const [challenges, setChallenges] = useState([]);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [leaderCelebration, setLeaderCelebration] = useState(false);
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
  const previousRankRef = useRef(null);

  const pointsBalance =
    totalPoints !== null
      ? totalPoints
      : (dashboard?.points?.totalPoints ?? dashboard?.student?.points ?? 0);

  const currentRank = getRankInfo(pointsBalance);
  const rankRange = currentRank.milestoneCap - currentRank.min;
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(((pointsBalance - currentRank.min) / rankRange) * 100),
    ),
  );

  const remainingPoints = Math.max(0, currentRank.milestoneCap - pointsBalance);

  const progressLabel = currentRank.nextLabel
    ? `أنت ${currentRank.name} — ${pointsBalance - currentRank.min} من ${rankRange} نقطة نحو ${currentRank.nextLabel}`
    : `أنت ${currentRank.name}! استمر في التألق!`;

  const currentRankName = currentRank.name;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const currentRankName = currentRank.name;
    const previousRank = previousRankRef.current;
    if (previousRank && previousRank !== currentRankName) {
      celebrateRankUp(currentRankName);
    }
    previousRankRef.current = currentRankName;
  }, [currentRankName]);

  const playCelebrationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(520, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch (err) {
      console.error("Audio celebration failed:", err);
    }
  };

  const celebrateRankUp = (rankName) => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#a3e635", "#fb7185", "#f97316", "#8b5cf6"],
    });
    playCelebrationSound();
    setCelebrationMessage(`تهانينا يا بطل! لقد أصبحت ${rankName} الآن 🎉`);
    if (rankName === "قائد") {
      setLeaderCelebration(true);
      setTimeout(() => setLeaderCelebration(false), 5200);
    }
    setTimeout(() => setCelebrationMessage(""), 4600);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/student/dashboard");
        setDashboard(response.data);
      } catch (err) {
        console.error("فشل تحميل لوحة الطالب:", err);
        setError("حدث خطأ أثناء تحميل بيانات الطالب. حاول لاحقا.");
      } finally {
        setLoading(false);
      }
    };

    const loadPoints = async () => {
      try {
        const response = await api.get("/student/rewards");
        setAvailablePoints(response.data.availablePoints ?? 0);
        setTotalPoints(response.data.totalPoints ?? 0);
        setReservedPoints(response.data.reservedPoints ?? 0);
      } catch (err) {
        console.error("فشل تحميل رصيد النقاط:", err);
      }
    };

    const loadChallenges = async () => {
      try {
        const response = await api.get("/student/challenges");
        setChallenges(response.data.challenges || []);
        setTotalPoints((prev) =>
          prev !== null ? prev : (response.data.totalPoints ?? prev),
        );
      } catch (err) {
        console.error("فشل تحميل تحديات الحلقة:", err);
      }
    };

    loadDashboard();
    loadPoints();
    loadChallenges();
  }, []);

  useEffect(() => {
    const loadTodayLesson = async () => {
      if (!dashboard?.group?._id) {
        setTodayLesson(null);
        setTodayLessonLoading(false);
        return;
      }

      try {
        setTodayLessonLoading(true);
        const response = await api.get(
          `/groups/${dashboard.group._id}/current-lesson`,
        );
        setTodayLesson(response.data);
      } catch (err) {
        console.error("فشل تحميل درس اليوم:", err);
        setTodayLesson(null);
      } finally {
        setTodayLessonLoading(false);
      }
    };

    if (dashboard) {
      loadTodayLesson();
    }
  }, [dashboard]);

  useEffect(() => {
    if (!complaintsModalOpen) return;

    const fetchMyTickets = async () => {
      setTicketsError("");
      setTicketsLoading(true);
      try {
        const response = await api.get("/tickets/my-tickets");
        setUserTickets(response.data.tickets || []);
      } catch (error) {
        console.error("فشل تحميل تذاكر المستخدم:", error);
        setTicketsError(getApiErrorMessage(error, "حدث خطأ أثناء جلب تذاكرك."));
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchMyTickets();
  }, [complaintsModalOpen]);

  const handleSubmitTicket = async (event) => {
    event.preventDefault();
    setTicketsError("");

    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      setTicketsError("يرجى ملء الموضوع والوصف قبل إرسال الطلب.");
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
        "تم إرسال طلبك بنجاح. يمكنك متابعة الحالة من خلال طلباتي السابقة.",
      );
    } catch (error) {
      console.error("فشل إرسال التذكرة:", error);
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
          <div className="rounded-3xl bg-white p-4 md:p-6 shadow-sm border border-rose-200 text-rose-700">
            <h1 className="text-2xl font-semibold">تعذر تحميل لوحة الطالب</h1>
            <p className="mt-4 text-sm">{error}</p>
          </div>
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
      <div className="w-full max-w-full mx-auto px-4 py-8">
        <header className="rounded-3xl bg-white p-4 md:p-6 shadow-sm border border-slate-200 mb-8">
          <AnnouncementsBanner />
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:flex-wrap">
            <div className="rounded-[2rem] bg-gradient-to-r from-lime-400 via-orange-400 to-purple-500 p-6 md:p-8 text-white shadow-[0_30px_60px_rgba(167,243,45,0.25)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                    شريط القوة
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-4xl shadow-lg">
                      {currentRank.icon}
                    </span>
                    <div>
                      <p className="text-3xl font-semibold">
                        {currentRank.name}
                      </p>
                      <p className="mt-2 text-sm text-white/90">
                        {progressLabel}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-full bg-white/20 p-1">
                    <div
                      className="h-4 rounded-full bg-white shadow-sm transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-white/15 p-4 text-sm text-white/90">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                        النقاط المتاحة
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {availablePoints ?? 0}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white/15 p-4 text-sm text-white/90">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                        إجمالي النقاط
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {totalPoints ?? 0}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white/15 p-4 text-sm text-white/90">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                        النقاط المحجوزة
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {reservedPoints ?? 0}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 max-w-xl text-sm text-white/90">
                    {currentRank.nextLabel
                      ? `متبقي ${remainingPoints} نقطة للوصول إلى اللقب التالي`
                      : "لقد وصلت إلى القمة الفخرية للألقاب! 🎉"}
                  </p>
                </div>
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15 text-6xl shadow-xl ring-1 ring-white/30">
                  {currentRank.icon}
                </div>
              </div>
            </div>

            {celebrationMessage ? (
              <div className="rounded-3xl bg-lime-50 border border-lime-200 p-4 text-lime-900 shadow-sm">
                {celebrationMessage}
              </div>
            ) : null}

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">الشكاوى والاقتراحات</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    تابع طلباتك أو قدّم شكوى جديدة
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    افتح نافذة الشكاوى للاطلاع على سجل طلباتك أو إرسال تذكرة
                    جديدة.
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

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 mb-8 w-full">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">جدار الأوسمة</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    الوسوم المكتسبة
                  </h3>
                </div>
                <span className="rounded-full bg-quran-100 px-4 py-2 text-sm font-semibold text-quran-800">
                  {dashboard.student.badges?.length || 0} وسام
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {dashboard.student.badges?.length ? (
                  dashboard.student.badges.map((badgeEntry) => (
                    <div
                      key={badgeEntry._id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-quran-100 text-2xl">
                          {badgeEntry.badgeId?.icon || "🏅"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {badgeEntry.badgeId?.name || "وسام"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {badgeEntry.badgeId?.description || "وسام مكافأة"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <span>
                          نقاط: {badgeEntry.badgeId?.pointsReward || 0}
                        </span>
                        <span>
                          {new Date(badgeEntry.awardedAt).toLocaleDateString(
                            "ar-EG",
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
                    <p className="text-lg font-semibold text-slate-900">
                      لم تحصل على أوسمة بعد.. اجتهد وكن بطل الكتّاب لتزين جدارك!
                      🏆
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      اكسب نقاطاً إضافية عبر التحديات والواجبات لتفتح أول وسام.
                    </p>
                    <Link
                      to="/rewards"
                      className="mt-5 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                    >
                      تصفح المتجر
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-quran-100 p-6 shadow-sm">
                <p className="text-sm text-quran-700">المعلم</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">
                  {dashboard.teacher
                    ? `${dashboard.teacher.firstName} ${dashboard.teacher.lastName}`
                    : "غير محدد"}
                </p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <p className="text-sm text-slate-500">الحلقة</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">
                  {dashboard.group ? dashboard.group.name : "لم تسجل بعد"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-4 md:p-6 shadow-sm border border-slate-200 mb-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                التحضير المسبق لدرس اليوم
              </h2>
              <p className="text-sm text-slate-500">
                اطلع على خطة الدرس الحالي قبل الحصة.
              </p>
            </div>
          </div>
          {todayLessonLoading ? (
            <p className="text-sm text-slate-600">جاري تحميل الدرس...</p>
          ) : todayLesson?.curriculum ? (
            <div className="space-y-6">
              <div className="rounded-3xl bg-quran-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">درس اليوم</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                      {todayLesson.lesson?.title || "درس غير محدد"}
                    </h3>
                  </div>
                  <span className="rounded-3xl bg-white px-4 py-2 text-sm font-semibold text-quran-700 shadow-sm">
                    حلقة {dashboard.group?.name}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">المهمة</p>
                    <p className="mt-2 text-slate-700">
                      {todayLesson.lesson?.task || "لا توجد مهمة محددة."}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">رابطات المراجعة</p>
                    <div className="mt-3 flex flex-col gap-3">
                      {todayLesson.lesson?.videoUrl ? (
                        <a
                          href={todayLesson.lesson.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-3xl bg-quran-100 px-4 py-3 text-sm font-semibold text-quran-800 hover:bg-quran-200"
                        >
                          مشاهدة فيديو الدرس
                        </a>
                      ) : null}
                      {todayLesson.lesson?.pdfUrl ? (
                        <a
                          href={todayLesson.lesson.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-3xl bg-quran-100 px-4 py-3 text-sm font-semibold text-quran-800 hover:bg-quran-200"
                        >
                          تحميل / عرض ملف PDF
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4 md:p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">خريطة الطريق</p>
                    <h3 className="text-2xl font-semibold text-slate-900">
                      تقدمك في المنهج
                    </h3>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-quran-800 shadow-sm">
                    {todayLesson.currentLessonIndex + 1} من{" "}
                    {todayLesson.totalLessons}
                  </span>
                </div>
                <div className="relative border-r-2 border-dashed border-slate-300 pr-8 overflow-hidden">
                  {todayLesson.curriculum.lessons.map((lesson, index) => {
                    const status =
                      index < todayLesson.currentLessonIndex
                        ? "completed"
                        : index === todayLesson.currentLessonIndex
                          ? "current"
                          : "locked";
                    const statusClasses =
                      status === "completed"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : status === "current"
                          ? "border-orange-500 bg-orange-500 text-white shadow-lg"
                          : "border-slate-300 bg-slate-100 text-slate-500";
                    const badgeIcon =
                      status === "completed"
                        ? "✓"
                        : status === "current"
                          ? "⭐"
                          : "🔒";
                    return (
                      <div
                        key={`${lesson.title}-${index}`}
                        className="mb-8 relative"
                      >
                        <span
                          className={`absolute -right-7 top-2 flex h-12 w-12 items-center justify-center rounded-full border-2 ${statusClasses}`}
                        >
                          {badgeIcon}
                        </span>
                        <div
                          className={`rounded-3xl border p-5 pr-16 ${
                            status === "current"
                              ? "border-orange-200 bg-orange-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            الدرس {index + 1}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-slate-900">
                            {lesson.title}
                          </h4>
                          <p className="mt-2 text-sm text-slate-600">
                            {lesson.task || "درس جديد في طريقك نحو النجاح."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-4 md:p-6 text-slate-600">
              {dashboard.group
                ? "لم يتم تعيين منهج لهذه المجموعة بعد."
                : "لم يتم تسجيلك في حلقة بعد."}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-4 md:p-6 shadow-sm border border-slate-200 mb-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                تحدياتك الحالية
              </h2>
              <p className="text-sm text-slate-500">
                تابع تقدمك في التحديات واكسب مكافآت إضافية.
              </p>
            </div>
            <span className="rounded-full bg-quran-100 px-4 py-2 text-sm font-semibold text-quran-800">
              {challenges.length} تحدي
            </span>
          </div>

          {challenges.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {challenges.map((challenge) => {
                const progress = Math.min(
                  100,
                  challenge.completedTasks && challenge.totalTasks
                    ? Math.round(
                        (challenge.completedTasks / challenge.totalTasks) * 100,
                      )
                    : 0,
                );
                const statusLabel = challenge.completed
                  ? "منجز"
                  : challenge.inProgress
                    ? "قيد التنفيذ"
                    : "غير مكتمل";
                return (
                  <div
                    key={challenge._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">
                          {challenge.category || "تحدي"}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">
                          {challenge.title}
                        </h3>
                      </div>
                      <span className="rounded-full bg-quran-100 px-3 py-1 text-xs font-semibold uppercase text-quran-800">
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">
                      {challenge.description ||
                        "اكمل المهمة لتحصل على نقاط إضافية."}
                    </p>
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                        <span>تقدم</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>مهام منجزة: {challenge.completedTasks || 0}</span>
                      <span>من أصل {challenge.totalTasks || 1}</span>
                      <span>نقاط الجائزة: {challenge.pointsReward || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-4 md:p-6 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-900">
                استعد للتحديات القادمة يا بطل! 💪
              </p>
              <p className="mt-3 text-sm text-slate-600">
                تواصل مع معلمك لفتح تحديات جديدة أو احفظ نقاطك لتشتري مكافآت
                رائعة.
              </p>
              <Link
                to="/rewards"
                className="mt-5 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                اطلع على المكافآت
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-4 md:p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                سجل التقييمات
              </h2>
              <p className="text-sm text-slate-500">
                استعرض التقييمات المرتبة من الأحدث إلى الأقدم.
              </p>
            </div>
            <span className="rounded-full bg-quran-100 px-4 py-2 text-sm font-semibold text-quran-800">
              عدد التقييمات {dashboard.evaluations.length}
            </span>
          </div>

          {dashboard.evaluations.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-600">
              لا توجد تقييمات بعد. سيظهر سجل التقييم بعد أول تقييم يضيفه المعلم.
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.evaluations.map((item) => (
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
                        <p className="mt-1 font-semibold">{item.mistakes}</p>
                      </div>
                      <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                        <p className="text-slate-500">الحضور</p>
                        <p className="mt-1 font-semibold">
                          {item.attendance || "-"}
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
                      <p className="font-semibold text-slate-800">المراجعة</p>
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
                    <p className="mt-2">{item.notes || "لا توجد ملاحظات."}</p>
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
        </section>

        <section className="mt-8">
          <PointsSystemGuide />
        </section>

        {complaintsModalOpen ? (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    الشكاوى والاقتراحات
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    أنشئ تذكرة جديدة أو طالع قائمة طلباتك السابقة.
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
                    className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
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
                    className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      activeTicketTab === 1
                        ? "bg-quran-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    طلباتي السابقة
                  </button>
                </div>

                {activeTicketTab === 0 ? (
                  <form
                    onSubmit={handleSubmitTicket}
                    className="mt-6 space-y-5"
                  >
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
                          onChange={(event) =>
                            setTicketType(event.target.value)
                          }
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
                        {ticketSubmitLoading
                          ? "جارٍ الإرسال..."
                          : "إرسال الطلب"}
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
                          const statusInfo = getTicketStatusInfo(ticket.status);
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
                                    {getTicketTypeLabel(ticket.type)} ·{" "}
                                    {formatDate(ticket.createdAt)}
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
        ) : null}
      </div>
    </div>
  );
}
