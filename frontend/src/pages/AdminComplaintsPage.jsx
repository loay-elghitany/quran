import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const STATUS_OPTIONS = ["Pending", "In_Progress", "Resolved", "Closed"];
const TYPE_OPTIONS = ["Complaint", "Suggestion", "Technical_Issue", "Other"];
const ROLE_OPTIONS = ["Student", "Parent", "Teacher", "Admin"];

const typeClasses = {
  Complaint: "bg-rose-100 text-rose-700 border-rose-200",
  Suggestion: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Technical_Issue: "bg-sky-100 text-sky-700 border-sky-200",
  Other: "bg-amber-100 text-amber-700 border-amber-200",
};

const statusClasses = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  In_Progress: "bg-sky-100 text-sky-800 border-sky-200",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
};

const priorityClasses = {
  Urgent: "bg-rose-50 text-rose-700 border-rose-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-50 text-slate-700 border-slate-200",
};

const priorityLabels = {
  Urgent: "عاجل",
  High: "مرتفع",
  Medium: "متوسط",
  Low: "منخفض",
};

const formatDateAr = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatRelativeAr = (value) => {
  const then = new Date(value);
  const now = new Date();
  const diffMs = then - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

  if (Math.abs(diffDays) <= 7) {
    if (diffDays !== 0) return formatter.format(diffDays, "day");
    if (Math.abs(diffHours) >= 1) return formatter.format(diffHours, "hour");
    return formatter.format(diffMinutes, "minute");
  }

  return formatDateAr(value);
};

const getSenderLabel = (complaint) => {
  if (complaint.isAnonymous) {
    if (complaint.senderRole === "Parent") return "مجهول / ولي أمر";
    if (complaint.senderRole === "Student") return "مجهول / طالب";
    if (complaint.senderRole === "Teacher") return "مجهول / معلم";
    return `مجهول / ${complaint.senderRole}`;
  }
  return `${complaint.senderName || "المستخدم"} • ${complaint.senderRole}`;
};

const getInitials = (complaint) => {
  if (complaint.isAnonymous) return "م";
  if (!complaint.senderName) return "?";
  return complaint.senderName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

export default function AdminComplaintsPage() {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminReply, setAdminReply] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/complaints");
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("فشل تحميل الشكاوى والاقتراحات:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const matchesSubject = item.subject
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? item.status === statusFilter : true;
      const matchesType = typeFilter ? item.type === typeFilter : true;
      const matchesRole = roleFilter ? item.senderRole === roleFilter : true;
      return matchesSubject && matchesStatus && matchesType && matchesRole;
    });
  }, [complaints, searchTerm, statusFilter, typeFilter, roleFilter]);

  const metrics = useMemo(() => {
    const pending = complaints.filter(
      (item) => item.status === "Pending",
    ).length;
    const inProgress = complaints.filter(
      (item) => item.status === "In_Progress",
    ).length;
    const resolvedToday = complaints.filter((item) => {
      const created = new Date(item.createdAt);
      const today = new Date();
      return (
        item.status === "Resolved" &&
        created.toDateString() === today.toDateString()
      );
    }).length;
    const urgent = complaints.filter(
      (item) => item.priority === "Urgent",
    ).length;

    return { pending, inProgress, resolvedToday, urgent };
  }, [complaints]);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await api.put(`/admin/complaints/${complaintId}/status`, {
        status: newStatus,
      });
      setComplaints((prev) =>
        prev.map((item) =>
          item._id === complaintId ? { ...item, status: newStatus } : item,
        ),
      );
      setFeedbackMessage("تم تحديث الحالة بنجاح.");
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (error) {
      console.error("فشل تحديث الحالة:", error);
      setFeedbackMessage("حدث خطأ أثناء تحديث الحالة.");
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };

  const handlePriorityUpdate = async (complaintId, newPriority) => {
    try {
      await api.put(`/admin/complaints/${complaintId}/priority`, {
        priority: newPriority,
      });
      setComplaints((prev) =>
        prev.map((item) =>
          item._id === complaintId ? { ...item, priority: newPriority } : item,
        ),
      );
      setSelectedComplaint((prev) =>
        prev ? { ...prev, priority: newPriority } : prev,
      );
      setFeedbackMessage("تم تحديث أولوية الطلب.");
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (error) {
      console.error("فشل تحديث الأولوية:", error);
      setFeedbackMessage("حدث خطأ أثناء تحديث الأولوية.");
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };

  const handleSendReply = async () => {
    if (!selectedComplaint || !adminReply.trim()) return;
    try {
      await api.post(`/admin/complaints/${selectedComplaint._id}/reply`, {
        message: adminReply.trim(),
      });
      setAdminReply("");
      setFeedbackMessage("تم إرسال الرد بنجاح.");
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (error) {
      console.error("فشل إرسال الرد:", error);
      setFeedbackMessage("حدث خطأ أثناء إرسال الرد.");
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-cairo"
      dir="rtl"
    >
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
                مركز إدارة الشكاوى
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">
                إدارة الشكاوى والاقتراحات
              </h1>
              <p className="mt-3 text-slate-600 max-w-2xl">
                لوحة احترافية لمتابعة بلاغات المستخدمين واستجابات الإدارة بخطوات
                واضحة وسريعة.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm text-amber-700">المعلّقات</p>
              <p className="mt-4 text-3xl font-semibold text-amber-900">
                {metrics.pending}
              </p>
              <p className="mt-2 text-sm text-amber-700">
                قضايا تحتاج متابعة فورية
              </p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-6 shadow-sm">
              <p className="text-sm text-sky-700">قيد المعالجة</p>
              <p className="mt-4 text-3xl font-semibold text-sky-900">
                {metrics.inProgress}
              </p>
              <p className="mt-2 text-sm text-sky-700">
                قضايا يعمل عليها الفريق الآن
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
              <p className="text-sm text-emerald-700">تم حلها اليوم</p>
              <p className="mt-4 text-3xl font-semibold text-emerald-900">
                {metrics.resolvedToday}
              </p>
              <p className="mt-2 text-sm text-emerald-700">
                قضايا أغلقت في نفس اليوم
              </p>
            </div>
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
              <p className="text-sm text-rose-700">عاجلة</p>
              <p className="mt-4 text-3xl font-semibold text-rose-900">
                {metrics.urgent}
              </p>
              <p className="mt-2 text-sm text-rose-700">
                قضايا تحتاج تدخل سريع
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <label htmlFor="search" className="sr-only">
                بحث
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن طريق الموضوع"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[700px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
              >
                <option value="">كل الحالات</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "Pending"
                      ? "قيد الانتظار"
                      : status === "In_Progress"
                        ? "قيد المعالجة"
                        : status === "Resolved"
                          ? "محلول"
                          : "مغلق"}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
              >
                <option value="">كل الأنواع</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type === "Complaint"
                      ? "شكوى"
                      : type === "Suggestion"
                        ? "اقتراح"
                        : type === "Technical_Issue"
                          ? "مشكلة تقنية"
                          : "أخرى"}
                  </option>
                ))}
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
              >
                <option value="">كل المرسلين</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role === "Student"
                      ? "طالب"
                      : role === "Parent"
                        ? "ولي أمر"
                        : role === "Teacher"
                          ? "معلم"
                          : "إدارة"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-right">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    المرسل
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    الموضوع
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    النوع
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    الأولوية
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    التاريخ
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      جاري تحميل البيانات...
                    </td>
                  </tr>
                ) : filteredComplaints.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      لم يتم العثور على أي شكاوى أو اقتراحات.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-900 shadow-sm">
                            <span className="text-sm font-semibold">
                              {getInitials(item)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {getSenderLabel(item)}
                            </p>
                            {!item.isAnonymous && item.senderEmail && (
                              <p className="text-xs text-slate-500">
                                {item.senderEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="max-w-xs text-sm font-semibold text-slate-900">
                          {item.subject}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                          {item.shortDescription || item.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            typeClasses[item.type] || typeClasses.Other
                          }`}
                        >
                          {item.type === "Complaint"
                            ? "شكوى"
                            : item.type === "Suggestion"
                              ? "اقتراح"
                              : item.type === "Technical_Issue"
                                ? "مشكلة تقنية"
                                : "أخرى"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusUpdate(item._id, e.target.value)
                          }
                          className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status === "Pending"
                                ? "قيد الانتظار"
                                : status === "In_Progress"
                                  ? "قيد المعالجة"
                                  : status === "Resolved"
                                    ? "محلول"
                                    : "مغلق"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            priorityClasses[item.priority] ||
                            priorityClasses.Low
                          }`}
                        >
                          {priorityLabels[item.priority] || "منخفض"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-slate-500">
                        <div>{formatRelativeAr(item.createdAt)}</div>
                        <div className="mt-1 text-xs">
                          {formatDateAr(item.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedComplaint(item)}
                          className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    تفاصيل الطلب
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {selectedComplaint.subject}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                  <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {getSenderLabel(selectedComplaint)}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {selectedComplaint.isAnonymous
                            ? "تم إرسال الرسالة بشكل مجهول"
                            : "بيانات المرسل متاحة للعرض"}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-sm">
                        <span className="text-base font-semibold">
                          {getInitials(selectedComplaint)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                          الحالة
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {selectedComplaint.status === "Pending"
                            ? "قيد الانتظار"
                            : selectedComplaint.status === "In_Progress"
                              ? "قيد المعالجة"
                              : selectedComplaint.status === "Resolved"
                                ? "محلول"
                                : "مغلق"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                          الأولوية
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {priorityLabels[selectedComplaint.priority] ||
                            "منخفض"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      الوصف الكامل
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600 whitespace-pre-line">
                      {selectedComplaint.description || "لا يوجد وصف إضافي."}
                    </p>
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          الزمنية
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          تم الإنشاء{" "}
                          {formatRelativeAr(selectedComplaint.createdAt)}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDateAr(selectedComplaint.createdAt)}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      التفاعل الإداري
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      أرسل ردًا مباشرًا للمرسل وحفظ سجل التحديثات.
                    </p>
                    <textarea
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      rows={6}
                      placeholder="اكتب ردك هنا..."
                      className="mt-4 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                    />
                    <button
                      type="button"
                      onClick={handleSendReply}
                      className="mt-4 w-full rounded-3xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                    >
                      إرسال الرد
                    </button>
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          تغيير الأولوية
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          حدّث مستوى الأهمية بسرعة من هنا.
                        </p>
                      </div>
                      <select
                        value={selectedComplaint.priority}
                        onChange={(e) =>
                          handlePriorityUpdate(
                            selectedComplaint._id,
                            e.target.value,
                          )
                        }
                        className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                      >
                        {Object.keys(priorityLabels).map((level) => (
                          <option key={level} value={level}>
                            {priorityLabels[level]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  {feedbackMessage && (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      {feedbackMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
