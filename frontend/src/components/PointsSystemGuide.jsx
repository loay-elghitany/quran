import React from "react";

export default function PointsSystemGuide() {
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
              <span className="font-semibold text-quran-700">+10 نقاط</span>
            </li>
            <li>
              • متأخر:{" "}
              <span className="font-semibold text-quran-700">+5 نقاط</span>
            </li>
            <li className="text-red-600">
              • الغياب: خصم 20 نقطة <span className="font-semibold">(-20)</span>
            </li>
          </ul>
        </div>
        <div className="rounded-3xl bg-quran-50 p-4">
          <p className="font-semibold text-slate-900 mb-2">التقييم</p>
          <ul className="space-y-1">
            <li>
              • ممتاز:{" "}
              <span className="font-semibold text-quran-700">+50 نقطة</span>
            </li>
            <li>
              • جيد جداً:{" "}
              <span className="font-semibold text-quran-700">+40 نقطة</span>
            </li>
            <li>
              • جيد:{" "}
              <span className="font-semibold text-quran-700">+20 نقطة</span>
            </li>
          </ul>
        </div>
        <div className="rounded-3xl bg-quran-50 p-4">
          <p className="font-semibold text-slate-900 mb-2">الأخطاء</p>
          <p>
            • يتم خصم{" "}
            <span className="font-semibold text-quran-700">نقطتين (-2)</span>{" "}
            لكل خطأ أو تنبيه.
          </p>
        </div>
      </div>
    </div>
  );
}
