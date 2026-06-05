import React, { useState, useEffect } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function GroupsOverview() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get("/admin/groups");
        setGroups(response.data.groups);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">
            إدارة المجموعات
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            عرض جميع المجموعات وتفاصيلها
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quran-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-500">
              لا توجد مجموعات بعد. قم بإنشاء مجموعة جديدة للبدء.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group._id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {group.name}
                </h3>
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-quran-100 text-quran-800">
                    معلم:{" "}
                    {group.teacherId
                      ? `${group.teacherId.firstName} ${group.teacherId.lastName}`
                      : "غير محدد"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-700 mb-2">
                    الطلاب ({group.studentIds.length}):
                  </p>
                  {group.studentIds.length === 0 ? (
                    <p className="text-sm text-slate-500">لا يوجد طلاب</p>
                  ) : (
                    <ul className="space-y-1">
                      {group.studentIds.map((student) => (
                        <li
                          key={student._id}
                          className="text-sm text-slate-600 border-b border-slate-100 pb-1 last:border-b-0"
                        >
                          {student.firstName} {student.lastName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
