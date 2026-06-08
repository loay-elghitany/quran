import React, { useState, useEffect } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { getApiErrorMessage } from "../utils/apiError";

export default function GroupsOverview() {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    teacherId: "",
    studentIds: [],
    description: "",
    grade: "",
  });
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchGroups(), fetchUsers()]);
      } catch (error) {
        console.error("Failed to initialize groups page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchGroups = async () => {
    const response = await api.get("/admin/groups");
    setGroups(response.data.groups);
  };

  const fetchUsers = async () => {
    const [teachersRes, studentsRes] = await Promise.all([
      api.get("/admin/users?role=Teacher"),
      api.get("/admin/users?role=Student"),
    ]);

    setTeachers(teachersRes.data.users || []);
    setStudents(studentsRes.data.users || []);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name || "",
      teacherId: group.teacherId?._id || "",
      studentIds: group.studentIds?.map((student) => student._id) || [],
      description: group.description || "",
      grade: group.grade || "",
    });
    setStatusMessage("");
    setStatusType("success");
    document.body.style.overflow = "hidden";
    setModalOpen(true);
  };

  const closeEditModal = () => {
    setModalOpen(false);
    setEditingGroup(null);
    setStatusMessage("");
    document.body.style.overflow = "unset";
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setGroupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentToggle = (studentId) => {
    setGroupForm((prev) => {
      const selected = prev.studentIds.includes(studentId);
      return {
        ...prev,
        studentIds: selected
          ? prev.studentIds.filter((id) => id !== studentId)
          : [...prev.studentIds, studentId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingGroup) {
      return;
    }

    try {
      await api.put(`/admin/groups/${editingGroup._id}`, groupForm);
      setStatusMessage("تم تحديث المجموعة بنجاح.");
      setStatusType("success");
      closeEditModal();
      await fetchGroups();
    } catch (error) {
      setStatusMessage(getApiErrorMessage(error, "فشل تحديث المجموعة."));
      setStatusType("error");
    }
  };

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
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {group.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => openEditModal(group)}
                    className="inline-flex items-center rounded-full bg-quran-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-quran-700"
                  >
                    تعديل المجموعة
                  </button>
                </div>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-start justify-center p-4 md:p-10">
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-3xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  تعديل المجموعة
                </h2>
                <p className="text-sm text-slate-500">
                  قم بتحديث بيانات المجموعة ثم احفظ التغييرات.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-slate-500 transition hover:text-slate-800"
              >
                إغلاق
              </button>
            </div>

            {statusMessage && (
              <div
                className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
                  statusType === "success"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {statusMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  اسم المجموعة
                </label>
                <input
                  name="name"
                  value={groupForm.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-quran-600"
                  placeholder="أدخل اسم المجموعة"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  المعلم المسؤول
                </label>
                <select
                  name="teacherId"
                  value={groupForm.teacherId}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-quran-600"
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  الطلاب
                </label>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم الطالب..."
                  className="w-full mb-3 rounded-2xl border border-slate-300 px-4 py-2 text-sm"
                />

                <div className="mb-3 flex flex-wrap gap-2">
                  {groupForm.studentIds
                    .map((id) => students.find((s) => s._id === id))
                    .filter(Boolean)
                    .map((student) => (
                      <span
                        key={student._id}
                        className="inline-flex items-center gap-2 rounded-full bg-quran-50 border border-quran-200 px-3 py-1 text-sm text-quran-800"
                      >
                        {student.firstName} {student.lastName}
                        <button
                          type="button"
                          onClick={() =>
                            setGroupForm((prev) => ({
                              ...prev,
                              studentIds: prev.studentIds.filter(
                                (id) => id !== student._id,
                              ),
                            }))
                          }
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-quran-600 text-white text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>

                <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 max-h-72 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      لم يتم العثور على طلاب.
                    </p>
                  ) : (
                    students
                      .filter((student) => {
                        const full =
                          `${student.firstName} ${student.lastName}`.toLowerCase();
                        return full.includes(
                          studentSearchQuery.trim().toLowerCase(),
                        );
                      })
                      .map((student) => {
                        const selected = groupForm.studentIds.includes(
                          student._id,
                        );
                        const labelClass = `inline-flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:border-quran-300 ${selected ? "border-quran-500 bg-quran-50" : "border-slate-200 bg-white"}`;
                        return (
                          <label key={student._id} className={labelClass}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleStudentToggle(student._id)}
                              className="h-4 w-4 rounded border-slate-300 text-quran-600 focus:ring-quran-500"
                            />
                            <span>
                              {student.firstName} {student.lastName}
                            </span>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  الوصف
                </label>
                <textarea
                  name="description"
                  value={groupForm.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-quran-600"
                  placeholder="أدخل وصفا للمجموعة (اختياري)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  الصف الدراسي
                </label>
                <input
                  name="grade"
                  value={groupForm.grade}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-quran-600"
                  placeholder="أدخل الصف الدراسي"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-quran-700"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
