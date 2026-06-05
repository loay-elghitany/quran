import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await api.get("/announcements");
        setAnnouncements(response.data.announcements || []);
      } catch (err) {
        console.error("فشل تحميل الإعلانات:", err);
        setError("تعذر تحميل الإعلانات في الوقت الحالي.");
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return undefined;

    const interval = setInterval(() => {
      setActive((current) => (current + 1) % announcements.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-quran-50 border border-quran-200 p-5 shadow-sm">
        <p className="text-sm text-slate-600">جاري تحميل الإعلانات...</p>
      </div>
    );
  }

  if (error || announcements.length === 0) {
    return (
      <div className="rounded-3xl bg-quran-50 border border-quran-200 p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          لا توجد إعلانات جديدة في الوقت الحالي.
        </p>
      </div>
    );
  }

  const announcement = announcements[active];

  return (
    <div className="rounded-3xl bg-white border border-quran-200 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-quran-600">
            إعلان
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {announcement.title}
          </h2>
        </div>
        <span className="rounded-full bg-quran-100 px-3 py-2 text-sm font-semibold text-quran-800">
          {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(
            new Date(announcement.date),
          )}
        </span>
      </div>
      <p className="mt-4 text-slate-600 leading-7">{announcement.message}</p>
      <div className="mt-4 flex gap-2 text-sm text-slate-500">
        {announcements.map((_, index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full transition ${
              index === active ? "bg-quran-700" : "bg-slate-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
