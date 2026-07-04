import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function PointsSystemGuide() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/settings/gamification");
        setSettings(response.data.settings);
      } catch (err) {
        console.error("فشل تحميل إعدادات النقاط:", err);
        setError("تعذر تحميل إعدادات نظام النقاط.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-slate-800">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
          كيف يتم حساب النقاط؟
        </h2>
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-quran-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-slate-800">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
          كيف يتم حساب النقاط؟
        </h2>
        <div className="rounded-3xl bg-rose-50 p-4 text-rose-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  const s = settings;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-slate-800">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">
        كيف يتم حساب النقاط؟
      </h2>
      <div className="space-y-4 text-sm leading-7">
        <div className="rounded-3xl bg-quran-50 p-4">
          <p className="font-semibold text-slate-900 mb-2">الحضور</p>
          <ul className="space-y-1">
            <li>
              • حاضر:{" "}
              <span className="font-semibold text-quran-700">+20 نقطة</span>
            </li>
            <li className="text-red-600">
              • غائب بدون عذر: <span className="font-semibold">-15 نقطة</span>
            </li>
            <li>
              • غائب بعذر: <span className="font-semibold">0 نقطة</span>
            </li>
          </ul>
        </div>
        <div className="rounded-3xl bg-quran-50 p-4">
          <p className="font-semibold text-slate-900 mb-2">التقييم</p>
          <ul className="space-y-1">
            <li>
              • الدرجة الممنوحة تضرب في{" "}
              <span className="font-semibold text-quran-700">3</span> للحصول على
              نقاط التقييم.
            </li>
          </ul>
        </div>
        <div className="rounded-3xl bg-quran-50 p-4">
          <p className="font-semibold text-slate-900 mb-2">الأخطاء</p>
          <p>
            • يتم خصم{" "}
            <span className="font-semibold text-quran-700">
              {s.errorPenaltyMultiplier} نقطة
            </span>{" "}
            لكل خطأ أو تنبيه.
          </p>
        </div>
        <div className="rounded-3xl bg-quran-50 p-4">
          <p className="font-semibold text-slate-900 mb-2">
            بونص صفحات الحفظ والمراجعة
          </p>
          <ul className="space-y-1">
            <li>
              • كل صفحة حفظ جديدة تمنح{" "}
              <span className="font-semibold text-quran-700">
                +{s.memorizationPageBonus ?? 10} نقاط
              </span>
            </li>
            <li>
              • كل صفحة مراجعة تمنح{" "}
              <span className="font-semibold text-quran-700">
                +{s.revisionPageBonus ?? 5} نقاط
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
