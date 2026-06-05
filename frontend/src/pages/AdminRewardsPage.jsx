import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AdminRewardsManager from "../components/AdminRewardsManager";

export default function AdminRewardsPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-quran-600">
              إدارة المكافآت
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              لوحة إدارة المكافآت
            </h1>
            <p className="mt-3 text-slate-600">
              أضف، عدّل، واحذف المكافآت واستعرض طلبات استبدال الطلاب من مكان
              واحد.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            العودة إلى لوحة الإدارة
          </button>
        </div>
        <AdminRewardsManager />
      </div>
    </div>
  );
}
