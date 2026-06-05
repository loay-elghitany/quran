import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

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
    <nav className="bg-quran-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold font-kufi">كتّاب رتل وارتق</div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            {role && (
              <button
                onClick={() => navigate(dashboardPath)}
                className={`inline-flex items-center gap-2 rounded-3xl bg-white px-4 py-2 text-sm font-semibold text-quran-700 transition-colors shadow-sm hover:bg-slate-100 ${
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
                  onClick={() => navigate("/admin")}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                    isActive("/admin") ? "bg-quran-800" : "hover:bg-quran-800"
                  }`}
                >
                  لوحة الإدارة
                </button>
                <button
                  onClick={() => navigate("/admin/groups-overview")}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                    isActive("/admin/groups-overview")
                      ? "bg-quran-800"
                      : "hover:bg-quran-800"
                  }`}
                >
                  إدارة المجموعات
                </button>
                <button
                  onClick={() => navigate("/admin/rewards")}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                    isActive("/admin/rewards")
                      ? "bg-quran-800"
                      : "hover:bg-quran-800"
                  }`}
                >
                  إدارة المكافآت
                </button>
                <button
                  onClick={() => navigate("/admin/complaints")}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                    isActive("/admin/complaints")
                      ? "bg-quran-800"
                      : "hover:bg-quran-800"
                  }`}
                >
                  الشكاوى والاقتراحات
                </button>
                <button
                  onClick={() => navigate("/admin/curriculums")}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
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
                    onClick={() => navigate("/teacher/training")}
                    className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                      isActive("/teacher/training")
                        ? "bg-quran-800"
                        : "hover:bg-quran-800"
                    }`}
                  >
                    الحقيبة التدريبية
                  </button>
                )}
                <button
                  onClick={() => navigate("/leaderboard")}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                    isActive("/leaderboard")
                      ? "bg-quran-800"
                      : "hover:bg-quran-800"
                  }`}
                >
                  قائمة المتصدرين
                </button>
                {role !== "SuperAdmin" && (
                  <button
                    onClick={() => navigate("/rewards")}
                    className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
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
          <span className="text-sm capitalize">
            {role && getRoleLabel(role)}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-quran-600 rounded-lg hover:bg-quran-800 transition-colors text-sm font-semibold"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </nav>
  );
}
