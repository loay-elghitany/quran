import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import AnnouncementsBanner from "../components/AnnouncementsBanner";
import PointsSystemGuide from "../components/PointsSystemGuide";

const avatarOptions = [
  {
    id: "lion",
    name: "أسد",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Lion",
    threshold: 0,
  },
  {
    id: "falcon",
    name: "صقر",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Falcon",
    threshold: 0,
  },
  {
    id: "star",
    name: "نجمة",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Star",
    threshold: 0,
  },
  {
    id: "crown",
    name: "تاج",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Crown",
    threshold: 500,
  },
  {
    id: "unicorn",
    name: "يونيكورن",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Unicorn",
    threshold: 0,
  },
  {
    id: "panda",
    name: "باندا",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Panda",
    threshold: 0,
  },
  {
    id: "tiger",
    name: "نمر",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Tiger",
    threshold: 0,
  },
  {
    id: "dragon",
    name: "تنين",
    url: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Dragon",
    threshold: 500,
  },
];

const rankConfig = [
  { name: "شبل", icon: "🐾", min: 0, max: 200, nextLabel: "بطل" },
  { name: "بطل", icon: "🛡️", min: 201, max: 500, nextLabel: "قائد" },
  { name: "قائد", icon: "🏆", min: 501, max: null, nextLabel: null },
];

const getRankInfo = (points) => {
  return (
    rankConfig.find((rank) => {
      if (rank.max === null) return points >= rank.min;
      return points >= rank.min && points <= rank.max;
    }) || rankConfig[0]
  );
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
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [leaderCelebration, setLeaderCelebration] = useState(false);
  const previousRankRef = useRef(null);

  const pointsBalance =
    totalPoints !== null
      ? totalPoints
      : (dashboard?.points?.totalPoints ?? dashboard?.student?.points ?? 0);

  const currentRank = getRankInfo(pointsBalance);
  const progressPercent = currentRank.max
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((pointsBalance - currentRank.min) /
              (currentRank.max - currentRank.min)) *
              100,
          ),
        ),
      )
    : 100;

  const progressLabel = currentRank.max
    ? `أنت ${currentRank.name} — ${pointsBalance - currentRank.min} من ${
        currentRank.max - currentRank.min
      } نقطة للوصول إلى ${currentRank.nextLabel}`
    : `أنت ${currentRank.name}! استمر في التألق!`;

  const currentRankName = currentRank.name;
  const defaultAvatarUrl = avatarOptions[0].url;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (dashboard?.student?.avatar) {
      setSelectedAvatar(dashboard.student.avatar);
    }
  }, [dashboard]);

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

  const handleAvatarSelect = async (avatar) => {
    if (pointsBalance < avatar.threshold) {
      setAvatarMessage(
        `هذا الآفاتار الخاص يُفتح عندما تصل إلى ${avatar.threshold} نقطة.`,
      );
      return;
    }

    try {
      await api.patch("/student/avatar", { avatar: avatar.url });
      setSelectedAvatar(avatar.url);
      setAvatarMessage(`تهانينا! تم اختيار ${avatar.name} كصورتك الرمزية.`);
      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              student: {
                ...prev.student,
                avatar: avatar.url,
              },
            }
          : prev,
      );
    } catch (error) {
      console.error("فشل تحديث الصورة الرمزية:", error);
      setAvatarMessage("حدث خطأ أثناء تحديث الآفاتار. حاول مجددًا.");
    }
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
            <h1 className="text-2xl font-semibold">تعذر تحميل لوحة الطالب</h1>
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
        <header className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 mb-8">
          <AnnouncementsBanner />
          <div className="mt-8 space-y-6">
            <div className="rounded-[2rem] bg-gradient-to-r from-lime-400 via-orange-400 to-purple-500 p-8 text-white shadow-[0_30px_60px_rgba(167,243,45,0.25)]">
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
                    {currentRank.max
                      ? `${pointsBalance} نقطة من ${currentRank.max} نحو ${currentRank.nextLabel}`
                      : `${pointsBalance} نقطة - أنت قائد الآن!`}
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
                  <p className="text-sm text-slate-500">آفاتارك</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    اختر صورة رمزية ممتعة
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    بعض الصور الرمزية الخاصة تُفتح عند 500 نقطة. استمر
                    بالمغامرة!
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedAvatar ||
                      dashboard.student.avatar ||
                      defaultAvatarUrl
                    }
                    alt="Avatar"
                    className="h-20 w-20 rounded-3xl border border-slate-200 bg-slate-50 object-cover"
                  />
                  <div>
                    <p className="text-sm text-slate-500">الصورة الحالية</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {dashboard.student.firstName}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
                {avatarOptions.map((avatar) => {
                  const locked = pointsBalance < avatar.threshold;
                  const selected = selectedAvatar === avatar.url;
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      disabled={locked}
                      onClick={() => handleAvatarSelect(avatar)}
                      className={`relative overflow-hidden rounded-3xl border p-3 text-center transition ${
                        selected
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-white"
                      } ${locked ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5"}`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="mx-auto h-20 w-20"
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        {avatar.name}
                      </p>
                      {locked ? (
                        <span className="mt-2 block text-xs text-rose-600">
                          يُفتح عند {avatar.threshold}
                        </span>
                      ) : selected ? (
                        <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-2 py-1 text-[11px] text-white">
                          محدد
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {avatarMessage ? (
                <p className="mt-4 text-sm text-slate-600">{avatarMessage}</p>
              ) : null}
            </div>

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 mb-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

              <div className="rounded-3xl bg-slate-50 p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="relative border-l-2 border-dashed border-slate-300 pl-8">
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
                          className={`absolute -left-7 top-2 flex h-12 w-12 items-center justify-center rounded-full border-2 ${statusClasses}`}
                        >
                          {badgeIcon}
                        </span>
                        <div
                          className={`rounded-3xl border p-5 pl-16 ${
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
            <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
              {dashboard.group
                ? "لم يتم تعيين منهج لهذه المجموعة بعد."
                : "لم يتم تسجيلك في حلقة بعد."}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 mb-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="grid gap-4 lg:grid-cols-2">
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
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">
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

        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
    </div>
  );
}
