import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const getYouTubeVideoId = (url) => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/.*[?&]v=)([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

const toEmbedUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
};

const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (window.__quranYoutubeApiPromise) {
    return window.__quranYoutubeApiPromise;
  }

  window.__quranYoutubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;

    const finalize = () => {
      if (typeof previousReady === "function") {
        previousReady();
      }
      resolve();
    };

    const existingScript = document.getElementById("youtube-iframe-api");
    if (window.YT && window.YT.Player) {
      finalize();
      return;
    }

    if (existingScript) {
      const safeResolve = () => {
        if (window.YT && window.YT.Player) {
          finalize();
          return;
        }
        window.setTimeout(safeResolve, 150);
      };

      window.onYouTubeIframeAPIReady = () => {
        finalize();
      };
      safeResolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      finalize();
    };

    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onload = () => {
      if (window.YT && window.YT.Player) {
        finalize();
      }
    };
    tag.onerror = () => {
      console.warn(
        "YouTube API failed to load; video playback will remain disabled.",
      );
      finalize();
    };
    document.body.appendChild(tag);
  });

  return window.__quranYoutubeApiPromise;
};

export default function StudentLessons() {
  const [curriculum, setCurriculum] = useState(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completionBadge, setCompletionBadge] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [lessonMessage, setLessonMessage] = useState("");
  const [localProgressMap, setLocalProgressMap] = useState(new Map());

  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const progressDispatchRef = useRef(new Map());
  const completionCelebratedRef = useRef(false);
  const currentLessonRef = useRef(0);

  const currentLessonIndex = useMemo(() => {
    if (!curriculum) return 0;
    const normalizedIndex = Number(curriculum.currentLessonIndex ?? 0);
    return Math.max(
      0,
      Math.min(normalizedIndex, (curriculum.lessons?.length || 1) - 1),
    );
  }, [curriculum]);

  const lessons = curriculum?.lessons || [];
  const progressMap = useMemo(() => {
    const map = new Map();
    (curriculum?.progressList || []).forEach((item) => {
      map.set(item.lessonIndex, item);
    });
    localProgressMap.forEach((item) => {
      const existing = map.get(item.lessonIndex) || {};
      map.set(item.lessonIndex, { ...existing, ...item });
    });
    return map;
  }, [curriculum, localProgressMap]);

  const selectedLesson = lessons[selectedLessonIndex] || null;

  const clearProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const updateLocalProgress = (lessonIndex, percentage) => {
    const normalized = Math.min(100, Math.max(0, Number(percentage) || 0));
    setLocalProgressMap((prev) => {
      const next = new Map(prev);
      next.set(lessonIndex, {
        lessonIndex,
        watchPercentage: normalized,
        hasWatched: normalized >= 75,
        lastWatchedAt: new Date().toISOString(),
      });
      return next;
    });
  };

  const getCurrentProgress = () => {
    if (
      !playerRef.current ||
      typeof playerRef.current.getCurrentTime !== "function"
    ) {
      return null;
    }

    const duration = playerRef.current.getDuration?.() || 0;
    const currentTime = playerRef.current.getCurrentTime?.() || 0;

    if (!duration) {
      return null;
    }

    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  };

  const sendLessonProgress = async (percentage, force = false) => {
    if (
      !curriculum?._id ||
      selectedLessonIndex === undefined ||
      selectedLessonIndex === null
    ) {
      return;
    }

    const normalized = Math.min(100, Math.max(0, Number(percentage) || 0));
    const currentStep = Math.floor(normalized / 5) * 5;
    const lastStep = progressDispatchRef.current.get(selectedLessonIndex) ?? -5;

    updateLocalProgress(selectedLessonIndex, normalized);

    if (!force && currentStep <= lastStep) {
      return;
    }

    try {
      await api.post("/student/curriculum/student-lessons/track", {
        curriculumId: curriculum._id,
        lessonIndex: selectedLessonIndex,
        percentage: normalized,
      });
      progressDispatchRef.current.set(selectedLessonIndex, currentStep);
    } catch (err) {
      console.error("فشل حفظ تقدم الفيديو:", err);
    }
  };

  const triggerCelebration = () => {
    if (completionCelebratedRef.current) return;
    completionCelebratedRef.current = true;
    setCompletionBadge(true);
    setLessonMessage("تمت المشاهدة بنجاح يا بطل! 🌟");

    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#fbbf24", "#34d399", "#f472b6", "#60a5fa", "#f97316"],
    });

    setTimeout(() => {
      setCompletionBadge(false);
      setLessonMessage("");
    }, 3500);
  };

  const handleProgressMilestones = (percentage, force = false) => {
    const normalized = Math.min(100, Math.max(0, Number(percentage) || 0));
    sendLessonProgress(normalized, force);

    if (normalized >= 80 && !completionCelebratedRef.current) {
      triggerCelebration();
    }
  };

  const startProgressTracking = () => {
    clearProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      const percentage = getCurrentProgress();
      if (percentage === null) return;
      handleProgressMilestones(percentage);
    }, 5000);
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await api.get("/student/curriculum/student-lessons");
        const data = response.data || {};
        const curriculumData = data.curriculum || null;

        if (curriculumData && Array.isArray(curriculumData.lessons)) {
          const normalizedCurriculum = {
            ...curriculumData,
            currentLessonIndex: Number(data.currentLessonIndex ?? 0),
            progressList: Array.isArray(data.progressList)
              ? data.progressList
              : [],
          };

          const totalLessons = normalizedCurriculum.lessons.length || 1;
          const safeIndex = Math.max(
            0,
            Math.min(Number(data.currentLessonIndex ?? 0), totalLessons - 1),
          );

          setCurriculum(normalizedCurriculum);
          setSelectedLessonIndex(safeIndex);
          setError("");
          return;
        }

        setCurriculum(null);
        setSelectedLessonIndex(0);
        setError("");
      } catch (error) {
        console.error("فشل تحميل الدروس:", error);
        setCurriculum(null);
        setSelectedLessonIndex(0);
        setError(
          error?.response?.data?.message ||
            "تعذر تحميل الدروس في الوقت الحالي.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();

    return () => {
      clearProgressTracking();
      if (
        playerRef.current &&
        typeof playerRef.current.destroy === "function"
      ) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedLesson || !playerContainerRef.current) {
      clearProgressTracking();
      setVideoReady(false);
      return;
    }

    const videoId = getYouTubeVideoId(selectedLesson.videoUrl);
    if (!videoId) {
      clearProgressTracking();
      setVideoReady(false);
      return;
    }

    const initializePlayer = async () => {
      try {
        if (!window.YT || !window.YT.Player) {
          await loadYouTubeApi();
        }

        if (!playerContainerRef.current || !window.YT || !window.YT.Player) {
          setVideoReady(false);
          return;
        }

        if (
          playerRef.current &&
          typeof playerRef.current.destroy === "function"
        ) {
          playerRef.current.destroy();
        }

        completionCelebratedRef.current = false;
        currentLessonRef.current = selectedLessonIndex;
        progressDispatchRef.current.set(selectedLessonIndex, -5);
        setVideoReady(false);

        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            controls: 1,
          },
          events: {
            onReady: (event) => {
              setVideoReady(true);
              event.target.playVideo();
              startProgressTracking();
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                startProgressTracking();
              } else if (event.data === window.YT.PlayerState.ENDED) {
                clearProgressTracking();
                const percentage = getCurrentProgress();
                if (percentage !== null) {
                  handleProgressMilestones(100, true);
                }
                if (!completionCelebratedRef.current) {
                  triggerCelebration();
                }
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                clearProgressTracking();
                const percentage = getCurrentProgress();
                if (percentage !== null) {
                  handleProgressMilestones(percentage, true);
                }
              }
            },
          },
        });
      } catch (err) {
        console.error("فشل تجهيز الفيديو:", err);
        setVideoReady(false);
        setError("تعذر تشغيل الفيديو في هذا المتصفح. حاول مرة أخرى.");
      }
    };

    initializePlayer();

    return () => {
      clearProgressTracking();
      const percentage = getCurrentProgress();
      if (percentage !== null) {
        handleProgressMilestones(percentage, true);
      }
      if (
        playerRef.current &&
        typeof playerRef.current.destroy === "function"
      ) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, [selectedLessonIndex, selectedLesson]);

  useEffect(() => {
    if (
      curriculum &&
      lessons.length > 0 &&
      selectedLessonIndex > currentLessonIndex
    ) {
      setSelectedLessonIndex(currentLessonIndex);
    }
  }, [curriculum, lessons, selectedLessonIndex, currentLessonIndex]);

  const getLessonState = (index) => {
    if (index < currentLessonIndex)
      return { label: "مكتمل", tone: "green", icon: "✅" };
    if (index === currentLessonIndex)
      return { label: "الدرس الحالي", tone: "amber", icon: "✨" };
    return { label: "قادم", tone: "slate", icon: "🔒" };
  };

  const getProgressValue = (index) => {
    const value = progressMap.get(index)?.watchPercentage || 0;
    return Math.round(value);
  };

  const lessonCountLabel =
    lessons.length === 1 ? "درس واحد" : `${lessons.length} دروس`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50">
        <Navbar role="Student" />
        <main className="mx-auto max-w-5xl px-4 py-12 text-center text-lg text-slate-700">
          يجري تجهيز الدروس التعليمية...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50 text-slate-800">
      <Navbar role="Student" />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-200/70 via-yellow-100 to-emerald-100 p-6 shadow-lg shadow-amber-200/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Student lessons
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                رحلة الدروس والمرئيات 🎬
              </h1>
            </div>
            <div className="rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
              {curriculum
                ? `المنهج: ${curriculum.name}`
                : "لا يوجد منهج مخصص الآن"}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!curriculum ? (
          <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/80 p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">🌟</div>
            <h2 className="text-2xl font-bold text-slate-800">
              أحسنت! أنت على الطريق الصحيح.
            </h2>
            <p className="mt-3 text-slate-600">
              لا يوجد منهج مخصص لك الآن، لكننا سنضيف لك دروسك القريبة قريباً.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  خريطة الطريق
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {lessonCountLabel}
                </span>
              </div>

              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const state = getLessonState(index);
                  const isUnlocked = index <= currentLessonIndex;
                  const isSelected = selectedLessonIndex === index;
                  const progressValue = getProgressValue(index);
                  const hasWatched =
                    progressMap.get(index)?.hasWatched || false;

                  return (
                    <button
                      key={`${lesson.title}-${index}`}
                      type="button"
                      onClick={() =>
                        isUnlocked && setSelectedLessonIndex(index)
                      }
                      disabled={!isUnlocked}
                      className={`w-full rounded-[1.5rem] border p-3 text-right transition-all ${
                        isSelected
                          ? "border-amber-300 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]"
                          : "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/60"
                      } ${!isUnlocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{state.icon}</span>
                            <span className="truncate font-bold text-slate-800">
                              {lesson.title}
                            </span>
                          </div>
                          <div className="mt-2 text-xs font-semibold text-slate-500">
                            {state.label}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            state.tone === "green"
                              ? "bg-emerald-100 text-emerald-700"
                              : state.tone === "amber"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {state.label}
                        </span>
                      </div>

                      {isUnlocked && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              {hasWatched ? "تمت المشاهدة" : "التقدم"}
                            </span>
                            <span>{Math.round(progressValue)}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${hasWatched ? "bg-emerald-500" : "bg-amber-400"}`}
                              style={{ width: `${Math.round(progressValue)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {!isUnlocked && (
                        <div className="mt-3 rounded-xl bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-500">
                          سيبدأ قريباً في المسجد ⏳
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-200/60">
              {selectedLesson ? (
                <>
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-quran-700">
                        الدرس المختار
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">
                        {selectedLesson.title}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {selectedLessonIndex + 1} / {lessons.length}
                      </span>
                      {progressMap.get(selectedLessonIndex)?.hasWatched && (
                        <span className="rounded-full border border-emerald-300 bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                          تم المشاهدة بنجاح
                        </span>
                      )}
                    </div>
                  </div>

                  {completionBadge && (
                    <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-center text-base font-bold text-emerald-900 shadow-lg shadow-emerald-200/60 animate-pulse">
                      {lessonMessage}
                    </div>
                  )}

                  <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-inner">
                    <div className="relative aspect-video bg-black">
                      {selectedLesson.videoUrl ? (
                        <div
                          ref={playerContainerRef}
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lg font-bold text-white">
                          لا يوجد فيديو لهذا الدرس حاليًا
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                      {selectedLesson.task ||
                        "محتوى هذا الدرس سيظهر قريباً، ونتمنى لك متابعة رائعة."}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[190px]">
                      {selectedLesson.pdfUrl && (
                        <a
                          href={selectedLesson.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl bg-quran-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-quran-800"
                        >
                          تحميل ورقة النشاط 📄
                        </a>
                      )}
                      {selectedLesson.videoUrl && (
                        <a
                          href={selectedLesson.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl border border-quran-200 bg-quran-50 px-4 py-3 text-sm font-bold text-quran-700 transition hover:bg-quran-100"
                        >
                          مشاهدة على YouTube ▶️
                        </a>
                      )}
                    </div>
                  </div>

                  {videoReady && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                      {progressMap.get(selectedLessonIndex)?.watchPercentage
                        ? `تقدم المشاهدة: ${Math.round(progressMap.get(selectedLessonIndex)?.watchPercentage || 0)}%`
                        : "ابدأ المشاهدة لتتبع تقدمك."}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  لا يوجد درس متاح لهذا التحديد.
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
