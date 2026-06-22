import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ role }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    navigate("/login");
    setShowMobileMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  const navigateTo = (path) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  const getDashboardPath = (userRole) => {
    switch (userRole) {
      case "SuperAdmin":
        return "/admin";
      case "Teacher":
        return "/teacher";
      case "Student":
        return "/student";
      case "Parent":
        return "/parent";
      default:
        return "/";
    }
  };

  const getRoleLabel = (userRole) => {
    switch (userRole) {
      case "SuperAdmin":
        return "مدير النظام";
      case "Teacher":
        return "المعلم";
      case "Student":
        return "الطالب";
      case "Parent":
        return "ولي الأمر";
      default:
        return userRole;
    }
  };

  const dashboardPath = getDashboardPath(role);

  return (
    <nav className="bg-quran-700 text-white">
      <div className="max-w-7xl mx-auto w-full px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="text-2xl font-bold font-kufi min-w-0 truncate">
              كتّاب رتل وارتق
            </div>
            <button
              type="button"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition lg:hidden"
              aria-label="فتح القائمة"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>

          <div
            className={`w-full overflow-hidden rounded-3xl border border-white/10 bg-quran-800/95 transition-all duration-200 lg:border-none lg:bg-transparent lg:w-auto ${
              showMobileMenu ? "max-h-[1000px] py-4" : "max-h-0"
            } lg:max-h-full`}
          >
            <div className="flex flex-col gap-3 px-4 text-sm lg:flex-row lg:items-center lg:px-0 lg:gap-4">
              {role && (
                <button
                  type="button"
                  onClick={() => navigateTo(dashboardPath)}
                  className={`inline-flex min-w-0 items-center gap-2 rounded-3xl bg-white px-4 py-2 text-sm font-semibold text-quran-700 transition-colors shadow-sm hover:bg-slate-100 ${
                    isActive(dashboardPath) ? "ring-2 ring-quran-300" : ""
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" />
                  </svg>
                  لوحة التحكم
                </button>
              )}

              {role === "SuperAdmin" && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive("/admin") ? "bg-quran-800" : "hover:bg-quran-800"
                    }`}
                  >
                    لوحة الإدارة
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/groups-overview")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive("/admin/groups-overview")
                        ? "bg-quran-800"
                        : "hover:bg-quran-800"
                    }`}
                  >
                    إدارة المجموعات
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/rewards")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive("/admin/rewards")
                        ? "bg-quran-800"
                        : "hover:bg-quran-800"
                    }`}
                  >
                    إدارة المكافآت
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/complaints")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive("/admin/complaints")
                        ? "bg-quran-800"
                        : "hover:bg-quran-800"
                    }`}
                  >
                    الشكاوى والاقتراحات
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/curriculums")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive("/admin/curriculums")
                        ? "bg-quran-800"
                        : "hover:bg-quran-800"
                    }`}
                  >
                    إدارة المناهج
                  </button>
                </>
              )}

              {role && (
                <>
                  {role === "Teacher" && (
                    <button
                      type="button"
                      onClick={() => navigateTo("/teacher/training")}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive("/teacher/training")
                          ? "bg-quran-800"
                          : "hover:bg-quran-800"
                      }`}
                    >
                      الحقيبة التدريبية
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigateTo("/leaderboard")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive("/leaderboard")
                        ? "bg-quran-800"
                        : "hover:bg-quran-800"
                    }`}
                  >
                    قائمة المتصدرين
                  </button>
                  {role !== "SuperAdmin" && (
                    <button
                      type="button"
                      onClick={() => navigateTo("/rewards")}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive("/rewards")
                          ? "bg-quran-800"
                          : "hover:bg-quran-800"
                      }`}
                    >
                      المكافآت
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 px-4 text-sm lg:border-none lg:pt-0 lg:px-0 lg:flex-row lg:items-center lg:gap-4">
              <span className="min-w-0 truncate">
                {role && getRoleLabel(role)}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-quran-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-quran-800"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
