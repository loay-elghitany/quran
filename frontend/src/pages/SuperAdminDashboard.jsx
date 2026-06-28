import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getApiErrorMessage } from "../utils/apiError";
import Navbar from "../components/Navbar";
import PointsSystemGuide from "../components/PointsSystemGuide";
import AnnouncementsBanner from "../components/AnnouncementsBanner";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userType, setUserType] = useState("Teacher");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedStudentTeacher, setSelectedStudentTeacher] = useState("");
  const [selectedParentChildren, setSelectedParentChildren] = useState([]);
  const [selectedGroupTeacher, setSelectedGroupTeacher] = useState("");
  const [selectedGroupStudents, setSelectedGroupStudents] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [parentStudentSearchQuery, setParentStudentSearchQuery] = useState("");
  const [studentManagementSearchQuery, setStudentManagementSearchQuery] =
    useState("");
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentUpdateStatus, setStudentUpdateStatus] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [isExportingCredentials, setIsExportingCredentials] = useState(false);
  const [activeTab, setActiveTab] = useState("teachers");

  const tabs = [
    { key: "teachers", label: "المعلمين" },
    { key: "students", label: "الطلاب" },
    { key: "parents", label: "أولياء الأمور" },
    { key: "groups", label: "المجموعات" },
    { key: "settings", label: "إعدادات النقاط" },
  ];

  const [groupName, setGroupName] = useState("");
  const [groupStatus, setGroupStatus] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementStatus, setAnnouncementStatus] = useState("");

  // Gamification System Settings
  const [settings, setSettings] = useState({
    attendancePoints: 5,
    excusedAbsencePoints: 0,
    unexcusedAbsencePoints: 0,
    score_1: 1,
    score_2: 2,
    score_3: 3,
    score_4: 4,
    score_5: 5,
    score_6: 6,
    score_7: 7,
    score_8: 8,
    score_9: 9,
    score_10: 10,
    errorPenaltyMultiplier: 1,
  });
  const [settingsStatus, setSettingsStatus] = useState("");

  // Teacher / Parent edit modal states
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isTeacherEditModalOpen, setIsTeacherEditModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [isParentEditModalOpen, setIsParentEditModalOpen] = useState(false);
  const [teacherEditSearchQuery, setTeacherEditSearchQuery] = useState("");
  const [parentEditSearchQuery, setParentEditSearchQuery] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [teacherRes, studentRes, parentRes, groupRes] = await Promise.all(
          [
            api.get("/admin/users?role=Teacher"),
            api.get("/admin/users?role=Student"),
            api.get("/admin/users?role=Parent"),
            api.get("/admin/groups"),
          ],
        );

        const teachersData = teacherRes.data.users || [];
        const studentsData = studentRes.data.users || [];
        const parentsData = parentRes.data.users || [];
        const groupsData = groupRes.data.groups || [];

        setTeachers(teachersData);
        setStudents(studentsData);
        setParents(parentsData);
        setGroups(groupsData);
        setSelectedStudentTeacher(
          (current) => current || teachersData[0]?._id || "",
        );
        setSelectedGroupTeacher(
          (current) => current || teachersData[0]?._id || "",
        );
      } catch (error) {
        console.error("Failed to load admin reference data:", error);
      }
    };

    fetchAdminData();
  }, []);

  useEffect(() => {
    setSelectedGroupStudents([]);
  }, [selectedGroupTeacher]);

  // Fetch gamification settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/admin/settings/gamification");
        if (response.data.settings) {
          const s = response.data.settings;
          setSettings({
            attendancePoints: s.attendancePoints ?? 5,
            excusedAbsencePoints: s.excusedAbsencePoints ?? 0,
            unexcusedAbsencePoints: s.unexcusedAbsencePoints ?? 0,
            score_1: s.score_1 ?? 1,
            score_2: s.score_2 ?? 2,
            score_3: s.score_3 ?? 3,
            score_4: s.score_4 ?? 4,
            score_5: s.score_5 ?? 5,
            score_6: s.score_6 ?? 6,
            score_7: s.score_7 ?? 7,
            score_8: s.score_8 ?? 8,
            score_9: s.score_9 ?? 9,
            score_10: s.score_10 ?? 10,
            errorPenaltyMultiplier: s.errorPenaltyMultiplier ?? 1,
          });
        }
      } catch (error) {
        console.error("Failed to load gamification settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingsChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put("/admin/settings/gamification", settings);
      if (response.data.success) {
        setSettings(response.data.settings);
        setSettingsStatus("تم حفظ إعدادات نظام النقاط بنجاح.");
      }
    } catch (error) {
      setSettingsStatus(
        getApiErrorMessage(error, "فشل حفظ الإعدادات. حاول مرة أخرى."),
      );
    }
  };

  const getArabicRole = (role) => {
    switch (role) {
      case "Teacher":
        return "معلم";
      case "Student":
        return "طالب";
      case "Parent":
        return "ولي أمر";
      default:
        return role;
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        role: userType,
        firstName,
        lastName,
        email,
        password,
        phone,
      };

      if (userType === "Student") {
        payload.teacherId = selectedStudentTeacher;
      }

      if (userType === "Parent") {
        payload.childrenIds = selectedParentChildren;
      }

      await api.post("/admin/users", payload);
      setUserStatus(`${getArabicRole(userType)} تم إنشاؤه بنجاح.`);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPhone("");
    } catch (error) {
      setUserStatus(getApiErrorMessage(error, "غير قادر على إنشاء المستخدم."));
    }
  };

  const handleToggleParentChild = (studentId) => {
    setSelectedParentChildren((prev) =>
      prev.includes(studentId)
        ? prev.filter((current) => current !== studentId)
        : [...prev, studentId],
    );
  };

  const handleToggleGroupStudent = (studentId) => {
    setSelectedGroupStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((current) => current !== studentId)
        : [...prev, studentId],
    );
  };

  const removeSelectedGroupStudent = (studentId) => {
    setSelectedGroupStudents((prev) => prev.filter((id) => id !== studentId));
  };

  const removeSelectedParentChild = (studentId) => {
    setSelectedParentChildren((prev) => prev.filter((id) => id !== studentId));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/groups", {
        name: groupName,
        teacherId: selectedGroupTeacher,
        studentIds: selectedGroupStudents,
      });
      setGroupStatus("تم إنشاء المجموعة بنجاح.");
      setGroupName("");
      setSelectedGroupStudents([]);
    } catch (error) {
      setGroupStatus(getApiErrorMessage(error, "غير قادر على إنشاء المجموعة."));
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/announcements", {
        title: announcementTitle,
        message: announcementMessage,
      });
      setAnnouncementStatus("تم نشر الإعلان بنجاح.");
      setAnnouncementTitle("");
      setAnnouncementMessage("");
    } catch (error) {
      setAnnouncementStatus(
        getApiErrorMessage(error, "فشل نشر الإعلان. حاول مرة أخرى."),
      );
    }
  };

  const openStudentEditModal = (student) => {
    const normalizeId = (value) => String(value?._id || value);

    const currentGroup = groups.find((group) =>
      group.studentIds?.some(
        (id) => normalizeId(id) === normalizeId(student._id),
      ),
    );
    const currentParent = parents.find((parent) =>
      parent.childrenIds?.some(
        (id) => normalizeId(id) === normalizeId(student._id),
      ),
    );

    setEditingStudent({
      ...student,
      teacherId: student.teacherId || "",
      groupId: currentGroup?._id || "",
      parentId: currentParent?._id || "",
    });
    setStudentUpdateStatus("");
    setIsStudentEditModalOpen(true);
  };

  const handleEditingStudentChange = (field, value) => {
    setEditingStudent((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const parseCsvLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values.map((value) => value.trim());
  };

  const parseParentEmails = (rawValue) => {
    if (!rawValue) {
      return { fatherEmail: "", motherEmail: "" };
    }

    const parts = String(rawValue)
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      fatherEmail: parts[0] || "",
      motherEmail: parts[1] || "",
    };
  };

  const normalizeStudentCredentials = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === "object") {
      const list =
        payload.students || payload.credentials || payload.data || [];
      if (Array.isArray(list)) {
        return list;
      }
    }

    if (typeof payload === "string") {
      const text = payload.replace(/^\uFEFF/, "").trim();
      if (!text) {
        return [];
      }

      if (text.startsWith("{") || text.startsWith("[")) {
        try {
          const parsed = JSON.parse(text);
          return normalizeStudentCredentials(parsed);
        } catch (error) {
          console.warn(
            "Failed to parse JSON credential export payload.",
            error,
          );
        }
      }

      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        return [];
      }

      return lines.slice(1).map((line) => {
        const [
          studentName = "",
          studentEmail = "",
          teacherName = "",
          parentEmails = "",
        ] = parseCsvLine(line);
        const { fatherEmail, motherEmail } = parseParentEmails(parentEmails);

        return {
          studentName,
          studentEmail,
          defaultPassword: "12121212",
          teacherName,
          fatherEmail,
          motherEmail,
        };
      });
    }

    return [];
  };

  const buildCredentialCardsHtml = (credentials) => {
    const cardsHtml = credentials
      .map((credential, index) => {
        const studentName = credential.studentName || "—";
        const studentEmail = credential.studentEmail || "—";
        const fatherEmail = String(credential.fatherEmail || "").trim();
        const motherEmail = String(credential.motherEmail || "").trim();
        const shouldShowFather = fatherEmail && fatherEmail !== "—";
        const shouldShowMother = motherEmail && motherEmail !== "—";
        const cardNumber = index + 1;

        return `
          <article class="credential-card">
            <div class="card-top">
              <div class="card-icon">✦</div>
              <div>
                <div class="academy-name">مدرسة القرآن الكريم</div>
                <div class="academy-subtitle">بطاقة تعريف الطالب</div>
              </div>
            </div>
            <div class="card-body">
              <div class="card-field">
                <span>اسم الطالب</span>
                <strong>${escapeHtml(studentName)}</strong>
              </div>
              <div class="card-field">
                <span>إيميل الطالب</span>
                <strong>${escapeHtml(studentEmail)}</strong>
              </div>
              <div class="card-field">
                <span>كلمة المرور</span>
                <strong>${escapeHtml(credential.defaultPassword || "12121212")}</strong>
              </div>
              ${
                shouldShowFather
                  ? `
                <div class="card-field">
                  <span>إيميل الوالد</span>
                  <strong>${escapeHtml(fatherEmail)}</strong>
                </div>
              `
                  : ""
              }
              ${
                shouldShowMother
                  ? `
                <div class="card-field">
                  <span>إيميل الوالدة</span>
                  <strong>${escapeHtml(motherEmail)}</strong>
                </div>
              `
                  : ""
              }
            </div>
            <div class="card-footer">#${cardNumber}</div>
          </article>
        `;
      })
      .join("");

    return `<!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>بطاقات بيانات الطلاب</title>
          <style>
            @page { size: A4; margin: 0; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: "Segoe UI", Tahoma, Arial, sans-serif;
              background: #f5f5f0;
              color: #0f172a;
              padding: 10mm;
            }
            .page {
              width: 100%;
              min-height: 100vh;
              background: #fffdf7;
              border: 1px solid #c8a24f;
              border-radius: 20px;
              padding: 12mm;
            }
            .page-title {
              font-size: 22px;
              font-weight: 700;
              color: #0f766e;
              margin-bottom: 6mm;
              text-align: center;
            }
            .page-subtitle {
              font-size: 11px;
              color: #64748b;
              text-align: center;
              margin-bottom: 6mm;
            }
            .cards-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6mm;
            }
            .credential-card {
              border: 2px solid #0f766e;
              border-radius: 16px;
              padding: 5mm;
              background: linear-gradient(135deg, #fefefe 0%, #f7f3e8 100%);
              box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .card-top {
              display: flex;
              align-items: center;
              gap: 3mm;
              border-bottom: 1px solid #d8b46b;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }
            .card-icon {
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: linear-gradient(135deg, #0f766e, #c8a24f);
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 18px;
              font-weight: 700;
            }
            .academy-name {
              font-size: 14px;
              font-weight: 700;
              color: #0f766e;
            }
            .academy-subtitle {
              font-size: 10px;
              color: #7c6a3e;
            }
            .card-body {
              display: grid;
              gap: 2.3mm;
            }
            .card-field {
              background: rgba(255, 255, 255, 0.8);
              border: 1px solid #e7dfc7;
              border-radius: 10px;
              padding: 2.2mm 3mm;
            }
            .card-field span {
              display: block;
              font-size: 8px;
              color: #7c6a3e;
              margin-bottom: 1mm;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .card-field strong {
              display: block;
              font-size: 11px;
              color: #0f172a;
              word-break: break-word;
            }
            .card-footer {
              margin-top: 3mm;
              font-size: 9px;
              color: #64748b;
              text-align: left;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .page {
                border: none;
                border-radius: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="page-title">بطاقات بيانات الدخول للطلاب</div>
            <div class="page-subtitle">نسخة طباعة جاهزة - مناسبة للقطع والحفظ كملف PDF</div>
            <div class="cards-grid">${cardsHtml}</div>
          </div>
        </body>
      </html>`;
  };

  const handleExportCredentials = async () => {
    if (isExportingCredentials) {
      return;
    }

    setIsExportingCredentials(true);

    try {
      const response = await api.get("/admin/export/students-credentials", {
        responseType: "text",
      });

      const credentials = normalizeStudentCredentials(response.data);

      if (!credentials.length) {
        console.warn("No student credential data was returned.");
        return;
      }

      const printHtml = buildCredentialCardsHtml(credentials);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "-9999px";
      iframe.style.top = "-9999px";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      iframe.srcdoc = printHtml;
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printError) {
          console.error("Failed to trigger print dialog:", printError);
        }

        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      };
    } catch (error) {
      console.error("Failed to export student credentials:", error);
    } finally {
      window.setTimeout(() => {
        setIsExportingCredentials(false);
      }, 800);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const payload = {
        teacherId: editingStudent.teacherId || undefined,
        groupId: editingStudent.groupId ?? "",
        parentId: editingStudent.parentId ?? "",
      };

      const response = await api.put(
        `/admin/users/students/${editingStudent._id}`,
        payload,
      );

      const updatedStudent =
        response.data.user || response.data.student || editingStudent;

      setStudents((prev) =>
        prev.map((student) =>
          student._id === updatedStudent._id ? updatedStudent : student,
        ),
      );
      setStudentUpdateStatus("تم تحديث بيانات الطالب بنجاح.");
      setIsStudentEditModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      setStudentUpdateStatus(
        getApiErrorMessage(error, "غير قادر على تحديث بيانات الطالب."),
      );
    }
  };

  // ---- Teacher Edit handlers ----
  const openTeacherEditModal = (teacher) => {
    setEditingTeacher({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      password: "",
      _id: teacher._id,
    });
    setIsTeacherEditModalOpen(true);
  };

  const handleEditingTeacherChange = (field, value) => {
    setEditingTeacher((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;

    try {
      const payload = {};
      if (editingTeacher.firstName)
        payload.firstName = editingTeacher.firstName;
      if (editingTeacher.lastName) payload.lastName = editingTeacher.lastName;
      if (editingTeacher.email) payload.email = editingTeacher.email;
      if (editingTeacher.phone) payload.phone = editingTeacher.phone;
      if (editingTeacher.password) payload.password = editingTeacher.password;

      const response = await api.put(
        `/admin/users/teachers/${editingTeacher._id}`,
        payload,
      );

      const updatedTeacher = response.data.user || editingTeacher;

      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher._id === updatedTeacher._id ? updatedTeacher : teacher,
        ),
      );
      setIsTeacherEditModalOpen(false);
      setEditingTeacher(null);
    } catch (error) {
      console.error("Failed to update teacher:", error);
    }
  };

  // ---- Parent Edit handlers ----
  const openParentEditModal = (parent) => {
    const normalizeId = (value) => String(value?._id || value);
    const currentChildrenIds = (parent.childrenIds || []).map((id) =>
      normalizeId(id),
    );

    setEditingParent({
      firstName: parent.firstName || "",
      lastName: parent.lastName || "",
      email: parent.email || "",
      phone: parent.phone || "",
      password: "",
      _id: parent._id,
      childrenIds: currentChildrenIds,
    });
    setIsParentEditModalOpen(true);
  };

  const handleEditingParentChange = (field, value) => {
    setEditingParent((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleToggleEditParentChild = (studentId) => {
    setEditingParent((prev) => {
      if (!prev) return prev;
      const current = prev.childrenIds || [];
      return {
        ...prev,
        childrenIds: current.includes(studentId)
          ? current.filter((id) => id !== studentId)
          : [...current, studentId],
      };
    });
  };

  const handleUpdateParent = async (e) => {
    e.preventDefault();
    if (!editingParent) return;

    try {
      const payload = {};
      if (editingParent.firstName) payload.firstName = editingParent.firstName;
      if (editingParent.lastName) payload.lastName = editingParent.lastName;
      if (editingParent.email) payload.email = editingParent.email;
      if (editingParent.phone) payload.phone = editingParent.phone;
      if (editingParent.password) payload.password = editingParent.password;
      if (editingParent.childrenIds)
        payload.childrenIds = editingParent.childrenIds;

      const response = await api.put(
        `/admin/users/parents/${editingParent._id}`,
        payload,
      );

      const updatedParent = response.data.user || editingParent;

      setParents((prev) =>
        prev.map((parent) =>
          parent._id === updatedParent._id ? updatedParent : parent,
        ),
      );
      setIsParentEditModalOpen(false);
      setEditingParent(null);
    } catch (error) {
      console.error("Failed to update parent:", error);
    }
  };

  const filteredGroupStudents = selectedGroupTeacher
    ? students.filter(
        (student) => String(student.teacherId) === selectedGroupTeacher,
      )
    : [];

  const filteredGroupStudentsBySearch = filteredGroupStudents.filter(
    (student) => {
      if (!studentSearchQuery || studentSearchQuery.trim() === "") return true;
      const full = `${student.firstName} ${student.lastName}`.toLowerCase();
      return full.includes(studentSearchQuery.trim().toLowerCase());
    },
  );

  const filteredParentStudents = students.filter((student) => {
    if (!parentStudentSearchQuery || parentStudentSearchQuery.trim() === "")
      return true;
    const full = `${student.firstName} ${student.lastName}`.toLowerCase();
    return full.includes(parentStudentSearchQuery.trim().toLowerCase());
  });

  const filteredStudentManagement = students.filter((student) => {
    if (
      !studentManagementSearchQuery ||
      studentManagementSearchQuery.trim() === ""
    )
      return true;
    const full =
      `${student.firstName} ${student.lastName} ${student.email}`.toLowerCase();
    return full.includes(studentManagementSearchQuery.trim().toLowerCase());
  });

  const filteredTeacherEdit = teachers.filter((teacher) => {
    if (!teacherEditSearchQuery || teacherEditSearchQuery.trim() === "")
      return true;
    const full =
      `${teacher.firstName} ${teacher.lastName} ${teacher.email}`.toLowerCase();
    return full.includes(teacherEditSearchQuery.trim().toLowerCase());
  });

  const filteredParentEdit = parents.filter((parent) => {
    if (!parentEditSearchQuery || parentEditSearchQuery.trim() === "")
      return true;
    const full =
      `${parent.firstName} ${parent.lastName} ${parent.email}`.toLowerCase();
    return full.includes(parentEditSearchQuery.trim().toLowerCase());
  });

  const showUserCreationPanel = ["teachers", "students", "parents"].includes(
    activeTab,
  );

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 text-slate-800">
      <Navbar role={user?.role} />
      <div className="w-full max-w-full mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-1/4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-4">
              الإدارة السريعة
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-quran-600 text-white p-5">
                <h2 className="text-lg font-semibold">إجراءات سريعة</h2>
                <p className="mt-2 text-sm text-quran-100">
                  أنشئ مستخدمين جدد، قم بإدارة المجموعات، وابق على اطلاع دائم
                  بكل شيء من مكان واحد.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-100 p-5">
                <p className="text-sm leading-6">
                  كمدير عام، لديك القدرة على تشكيل تجربة التعلم بأكملها. استخدم
                  هذه اللوحة لإضافة معلمين جدد، تنظيم الطلاب في مجموعات، وضمان
                  أن كل شخص لديه الأدوات التي يحتاجها للنجاح.
                </p>
              </div>
              <PointsSystemGuide />
            </div>
          </aside>

          <main className="flex-1 space-y-8">
            <AnnouncementsBanner />
            <section className="grid gap-5 mb-8 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-[0_25px_60px_-30px_rgba(14,116,144,0.4)]">
                <p className="text-sm font-semibold text-slate-500">
                  إجمالي الطلاب
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {students.length}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  عدد الطلاب المسجلين في النظام.
                </p>
              </article>
              <article className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-[0_25px_60px_-30px_rgba(20,184,166,0.35)]">
                <p className="text-sm font-semibold text-slate-500">
                  إجمالي المعلمين
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {teachers.length}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  عدد المعلمين النشطين.
                </p>
              </article>
              <article className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-100 p-6 shadow-[0_25px_60px_-30px_rgba(16,185,129,0.3)]">
                <p className="text-sm font-semibold text-slate-500">
                  إجمالي المجموعات
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {groups.length}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  عدد المجموعات التي تم إنشاؤها.
                </p>
              </article>
              <article className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-slate-100 p-6 shadow-[0_25px_60px_-30px_rgba(20,184,166,0.25)]">
                <p className="text-sm font-semibold text-slate-500">
                  إجمالي أولياء الأمور
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {parents.length}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  عدد أولياء الأمور المرتبطين بالطلاب.
                </p>
              </article>
            </section>

            <section className="overflow-x-auto rounded-[32px] border border-slate-200 bg-white p-3 shadow-sm mb-8">
              <div className="flex flex-wrap items-center gap-3 px-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      activeTab === tab.key
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200/60"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            {showUserCreationPanel && (
              <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                      إنشاء مستخدم جديد
                    </h1>
                    <p className="text-sm text-slate-500">
                      أنشئ معلمين، طلاب أو أولياء أمور بسهولة من هنا.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCredentials}
                    disabled={isExportingCredentials}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                  >
                    {isExportingCredentials
                      ? "جاري تحضير ملف PDF..."
                      : "تصدير بيانات الدخول"}
                  </button>
                </div>
                <form className="space-y-4" onSubmit={handleCreateUser}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      دور المستخدم
                      <select
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                      >
                        <option value="Teacher">معلم</option>
                        <option value="Student">طالب</option>
                        <option value="Parent">ولي أمر</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      الاسم الأول
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="الاسم الأول"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      الاسم الأخير
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="الاسم الأخير"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      البريد الإلكتروني
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="معلم@مثال.com"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      كلمة المرور
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="كلمة مرور آمنة"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      الهاتف (اختياري)
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        placeholder="مثال: +966512345678"
                      />
                    </label>
                  </div>
                  {userType === "Student" && (
                    <div className="grid gap-4 md:grid-cols-1">
                      <label className="space-y-2 text-sm text-slate-700">
                        تعيين معلم
                        <select
                          value={selectedStudentTeacher}
                          onChange={(e) =>
                            setSelectedStudentTeacher(e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                        >
                          {teachers.length === 0 ? (
                            <option value="">لا يوجد معلم متاح</option>
                          ) : (
                            teachers.map((teacher) => (
                              <option key={teacher._id} value={teacher._id}>
                                {`${teacher.firstName} ${teacher.lastName}`}
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                    </div>
                  )}
                  {userType === "Parent" && (
                    <div className="space-y-4 text-sm text-slate-700">
                      <span>اختر أبناء / طلاب الوصي</span>
                      <input
                        type="text"
                        value={parentStudentSearchQuery}
                        onChange={(e) =>
                          setParentStudentSearchQuery(e.target.value)
                        }
                        placeholder="ابحث عن اسم الطالب..."
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                      />

                      <div className="flex flex-wrap gap-2">
                        {selectedParentChildren
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
                                  removeSelectedParentChild(student._id)
                                }
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-quran-600 text-white text-xs"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                      </div>

                      <div className="grid gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-4 max-h-72 overflow-y-auto">
                        {students.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            لا يوجد طلاب مسجلين بعد
                          </p>
                        ) : filteredParentStudents.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            لا يوجد طلاب يطابقون البحث
                          </p>
                        ) : (
                          filteredParentStudents.map((student) => {
                            const selected = selectedParentChildren.includes(
                              student._id,
                            );
                            const labelClass = `inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${selected ? "border-quran-500 bg-quran-50" : "border-slate-200 bg-white"}`;
                            return (
                              <label key={student._id} className={labelClass}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    handleToggleParentChild(student._id)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-quran-600"
                                />
                                <span>{`${student.firstName} ${student.lastName}`}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-quran-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-quran-700"
                    >
                      أنشئ {getArabicRole(userType)}
                    </button>
                    {userStatus && (
                      <span className="text-sm text-quran-700">
                        {userStatus}
                      </span>
                    )}
                  </div>
                </form>
              </section>
            )}

            {activeTab === "groups" && (
              <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      أنشئ مجموعة
                    </h2>
                    <p className="text-sm text-slate-500">
                      قم بتعيين معلم وحدد الطلاب للمجموعة الجديدة.
                    </p>
                  </div>
                </div>
                <form className="space-y-4" onSubmit={handleCreateGroup}>
                  <label className="space-y-2 text-sm text-slate-700">
                    اسم المجموعة
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      placeholder="مثال: مجموعة القرآن الصباحية"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      معلم
                      <select
                        value={selectedGroupTeacher}
                        onChange={(e) =>
                          setSelectedGroupTeacher(e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                      >
                        {teachers.length === 0 ? (
                          <option value="">لا يوجد معلم متاح</option>
                        ) : (
                          teachers.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>
                              {`${teacher.firstName} ${teacher.lastName}`}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <div className="space-y-2 text-sm text-slate-700">
                      <span>الطلاب</span>
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="ابحث عن اسم الطالب..."
                        className="w-full mb-3 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                      />

                      <div className="mb-3 flex flex-wrap gap-2">
                        {selectedGroupStudents
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
                                  removeSelectedGroupStudent(student._id)
                                }
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-quran-600 text-white text-xs"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                      </div>

                      <div className="grid gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-4 max-h-72 overflow-y-auto">
                        {selectedGroupTeacher === "" ? (
                          <p className="text-sm text-slate-500">
                            اختر معلمًا أولاً لرؤية الطلاب
                          </p>
                        ) : filteredGroupStudentsBySearch.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            لا يوجد طلاب مرتبطين بهذا المعلم
                          </p>
                        ) : (
                          filteredGroupStudentsBySearch.map((student) => {
                            const selected = selectedGroupStudents.includes(
                              student._id,
                            );
                            const labelClass = `inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${selected ? "border-quran-500 bg-quran-50" : "border-slate-200 bg-white"}`;
                            return (
                              <label key={student._id} className={labelClass}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    handleToggleGroupStudent(student._id)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-quran-600"
                                />
                                <span>{`${student.firstName} ${student.lastName}`}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
                    >
                      أنشئ مجموعة
                    </button>
                    {groupStatus && (
                      <span className="text-sm text-slate-700">
                        {groupStatus}
                      </span>
                    )}
                  </div>
                </form>
              </section>
            )}

            {/* ========== Teacher Management Section ========== */}
            {activeTab === "teachers" && (
              <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-slate-900">
                        إدارة المعلمين
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-quran-100 px-3 py-1 text-xs font-semibold text-quran-700">
                        {teachers.length} معلم
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      حرر بيانات المعلمين المسجلين.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={teacherEditSearchQuery}
                    onChange={(e) => setTeacherEditSearchQuery(e.target.value)}
                    placeholder="ابحث عن معلم بالاسم أو البريد الإلكتروني..."
                    className="w-full max-w-sm rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          الاسم
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          البريد الإلكتروني
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          الهاتف
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          إجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTeacherEdit.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            لا يوجد معلمين مطابقين للبحث.
                          </td>
                        </tr>
                      ) : (
                        filteredTeacherEdit.map((teacher) => (
                          <tr key={teacher._id}>
                            <td className="px-4 py-3">
                              {teacher.firstName} {teacher.lastName}
                            </td>
                            <td className="px-4 py-3">{teacher.email}</td>
                            <td className="px-4 py-3">
                              {teacher.phone || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => openTeacherEditModal(teacher)}
                                className="rounded-2xl bg-quran-600 px-4 py-2 text-sm font-semibold text-white hover:bg-quran-700"
                              >
                                تحرير
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========== Parent Management Section ========== */}
            {activeTab === "parents" && (
              <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-slate-900">
                        إدارة أولياء الأمور
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-quran-100 px-3 py-1 text-xs font-semibold text-quran-700">
                        {parents.length} ولي أمر
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      حرر بيانات أولياء الأمور المسجلين.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={parentEditSearchQuery}
                    onChange={(e) => setParentEditSearchQuery(e.target.value)}
                    placeholder="ابحث عن ولي أمر بالاسم أو البريد الإلكتروني..."
                    className="w-full max-w-sm rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          الاسم
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          البريد الإلكتروني
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          الهاتف
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          الأبناء
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          إجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredParentEdit.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            لا يوجد أولياء أمور مطابقين للبحث.
                          </td>
                        </tr>
                      ) : (
                        filteredParentEdit.map((parent) => {
                          const parentChildren = (parent.childrenIds || [])
                            .map((id) => {
                              const sid = String(id?._id || id);
                              return students.find((s) => s._id === sid);
                            })
                            .filter(Boolean);
                          return (
                            <tr key={parent._id}>
                              <td className="px-4 py-3">
                                {parent.firstName} {parent.lastName}
                              </td>
                              <td className="px-4 py-3">{parent.email}</td>
                              <td className="px-4 py-3">
                                {parent.phone || "—"}
                              </td>
                              <td className="px-4 py-3">
                                {parentChildren.length > 0
                                  ? parentChildren
                                      .map(
                                        (s) => `${s.firstName} ${s.lastName}`,
                                      )
                                      .join("، ")
                                  : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => openParentEditModal(parent)}
                                  className="rounded-2xl bg-quran-600 px-4 py-2 text-sm font-semibold text-white hover:bg-quran-700"
                                >
                                  تحرير
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========== Student Management Section ========== */}
            {activeTab === "students" && (
              <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-slate-900">
                        إدارة الطلاب
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-quran-100 px-3 py-1 text-xs font-semibold text-quran-700">
                        {filteredStudentManagement.length} / {students.length}{" "}
                        طالب
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      حرر المعلم والمجموعة وولي الأمر لكل طالب مسجل.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={studentManagementSearchQuery}
                    onChange={(e) =>
                      setStudentManagementSearchQuery(e.target.value)
                    }
                    placeholder="ابحث عن طالب بالاسم أو البريد الإلكتروني..."
                    className="w-full max-w-sm rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          الاسم
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          البريد الإلكتروني
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          المعلم الحالي
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                          إجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredStudentManagement.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            لا يوجد طلاب مطابقين للبحث.
                          </td>
                        </tr>
                      ) : (
                        filteredStudentManagement.map((student) => {
                          const teacher = teachers.find(
                            (t) => String(t._id) === String(student.teacherId),
                          );
                          return (
                            <tr key={student._id}>
                              <td className="px-4 py-3">
                                {student.firstName} {student.lastName}
                              </td>
                              <td className="px-4 py-3">{student.email}</td>
                              <td className="px-4 py-3">
                                {teacher
                                  ? `${teacher.firstName} ${teacher.lastName}`
                                  : "غير معين"}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => openStudentEditModal(student)}
                                  className="rounded-2xl bg-quran-600 px-4 py-2 text-sm font-semibold text-white hover:bg-quran-700"
                                >
                                  تحرير
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ===== Teacher Edit Modal ===== */}
            {isTeacherEditModalOpen && editingTeacher && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        تحرير بيانات المعلم
                      </h3>
                      <p className="text-sm text-slate-500">
                        عدِّل المعلومات الأساسية للمعلم. اترك كلمة المرور فارغة
                        للإبقاء عليها كما هي.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTeacherEditModalOpen(false);
                        setEditingTeacher(null);
                      }}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      إغلاق
                    </button>
                  </div>

                  <form onSubmit={handleUpdateTeacher} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-700">
                        الاسم الأول
                        <input
                          value={editingTeacher.firstName}
                          onChange={(e) =>
                            handleEditingTeacherChange(
                              "firstName",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="الاسم الأول"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        الاسم الأخير
                        <input
                          value={editingTeacher.lastName}
                          onChange={(e) =>
                            handleEditingTeacherChange(
                              "lastName",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="الاسم الأخير"
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-700">
                        البريد الإلكتروني
                        <input
                          type="email"
                          value={editingTeacher.email}
                          onChange={(e) =>
                            handleEditingTeacherChange("email", e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="معلم@مثال.com"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        الهاتف
                        <input
                          type="tel"
                          value={editingTeacher.phone}
                          onChange={(e) =>
                            handleEditingTeacherChange("phone", e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="مثال: +966512345678"
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-1">
                      <label className="space-y-2 text-sm text-slate-700">
                        كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)
                        <input
                          type="password"
                          value={editingTeacher.password}
                          onChange={(e) =>
                            handleEditingTeacherChange(
                              "password",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="كلمة مرور جديدة"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsTeacherEditModalOpen(false);
                          setEditingTeacher(null);
                        }}
                        className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="rounded-2xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white hover:bg-quran-700"
                      >
                        حفظ التغييرات
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ===== Parent Edit Modal ===== */}
            {isParentEditModalOpen && editingParent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        تحرير بيانات ولي الأمر
                      </h3>
                      <p className="text-sm text-slate-500">
                        عدِّل المعلومات الأساسية وأبناء ولي الأمر.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsParentEditModalOpen(false);
                        setEditingParent(null);
                      }}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      إغلاق
                    </button>
                  </div>

                  <form onSubmit={handleUpdateParent} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-700">
                        الاسم الأول
                        <input
                          value={editingParent.firstName}
                          onChange={(e) =>
                            handleEditingParentChange(
                              "firstName",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="الاسم الأول"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        الاسم الأخير
                        <input
                          value={editingParent.lastName}
                          onChange={(e) =>
                            handleEditingParentChange(
                              "lastName",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="الاسم الأخير"
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-700">
                        البريد الإلكتروني
                        <input
                          type="email"
                          value={editingParent.email}
                          onChange={(e) =>
                            handleEditingParentChange("email", e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="وليأمر@مثال.com"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        الهاتف
                        <input
                          type="tel"
                          value={editingParent.phone}
                          onChange={(e) =>
                            handleEditingParentChange("phone", e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="مثال: +966512345678"
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-1">
                      <label className="space-y-2 text-sm text-slate-700">
                        كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)
                        <input
                          type="password"
                          value={editingParent.password}
                          onChange={(e) =>
                            handleEditingParentChange(
                              "password",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="كلمة مرور جديدة"
                        />
                      </label>
                    </div>

                    {/* Children checkboxes in edit modal */}
                    <div className="space-y-2 text-sm text-slate-700">
                      <span>الأبناء / الطلاب المرتبطون</span>
                      <div className="grid gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-4 max-h-72 overflow-y-auto">
                        {students.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            لا يوجد طلاب مسجلين بعد
                          </p>
                        ) : (
                          students.map((student) => {
                            const selected = (
                              editingParent.childrenIds || []
                            ).includes(student._id);
                            const labelClass = `inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${selected ? "border-quran-500 bg-quran-50" : "border-slate-200 bg-white"}`;
                            return (
                              <label key={student._id} className={labelClass}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    handleToggleEditParentChild(student._id)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-quran-600"
                                />
                                <span>{`${student.firstName} ${student.lastName}`}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsParentEditModalOpen(false);
                          setEditingParent(null);
                        }}
                        className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="rounded-2xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white hover:bg-quran-700"
                      >
                        حفظ التغييرات
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ===== Student Edit Modal ===== */}
            {isStudentEditModalOpen && editingStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        تحرير بيانات الطالب
                      </h3>
                      <p className="text-sm text-slate-500">
                        عدِّل المعلم والمجموعة وولي الأمر للطالب المحدد.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStudentEditModalOpen(false);
                        setEditingStudent(null);
                        setStudentUpdateStatus("");
                      }}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      إغلاق
                    </button>
                  </div>

                  <form onSubmit={handleUpdateStudent} className="space-y-4">
                    <label className="space-y-2 text-sm text-slate-700">
                      المعلم
                      <select
                        value={editingStudent.teacherId || ""}
                        onChange={(e) =>
                          handleEditingStudentChange(
                            "teacherId",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                      >
                        <option value="">اختر معلمًا</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.firstName} {teacher.lastName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      المجموعة
                      <select
                        value={editingStudent.groupId ?? ""}
                        onChange={(e) =>
                          handleEditingStudentChange("groupId", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                      >
                        <option value="">لا توجد مجموعة</option>
                        {groups.map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      ولي الأمر
                      <select
                        value={editingStudent.parentId ?? ""}
                        onChange={(e) =>
                          handleEditingStudentChange("parentId", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                      >
                        <option value="">لا يوجد ولي أمر</option>
                        {parents.map((parent) => (
                          <option key={parent._id} value={parent._id}>
                            {parent.firstName} {parent.lastName}
                          </option>
                        ))}
                      </select>
                    </label>

                    {studentUpdateStatus && (
                      <p className="text-sm text-quran-700">
                        {studentUpdateStatus}
                      </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsStudentEditModalOpen(false);
                          setEditingStudent(null);
                          setStudentUpdateStatus("");
                        }}
                        className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="rounded-2xl bg-quran-600 px-5 py-3 text-sm font-semibold text-white hover:bg-quran-700"
                      >
                        حفظ التغييرات
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <section className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    انشر إعلانًا جديدًا
                  </h2>
                  <p className="text-sm text-slate-500">
                    شارك التحديثات والملاحظات المهمة مع جميع الطلاب وأولياء
                    الأمور.
                  </p>
                </div>
              </div>
              <form className="space-y-4" onSubmit={handleCreateAnnouncement}>
                <input
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="عنوان الإعلان"
                  className="w-full rounded-3xl border border-slate-300 px-4 py-3"
                />
                <textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="نص الإعلان"
                  className="w-full min-h-[140px] rounded-3xl border border-slate-300 px-4 py-3"
                />
                <button
                  type="submit"
                  className="rounded-3xl bg-quran-700 px-6 py-3 text-white hover:bg-quran-800"
                >
                  نشر الإعلان
                </button>
                {announcementStatus ? (
                  <p className="text-sm text-quran-700">{announcementStatus}</p>
                ) : null}
              </form>
            </section>

            {/* ========== Points System Management Section ========== */}
            {activeTab === "settings" && (
              <section className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    إدارة نظام النقاط
                  </h2>
                  <p className="text-sm text-slate-500">
                    تحكم في نقاط الحضور والتقييمات وخصومات الأخطاء بشكل
                    ديناميكي.
                  </p>
                </div>
                <form className="space-y-6" onSubmit={handleSaveSettings}>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">
                      نقاط الحضور والغياب
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-2 text-sm text-slate-700">
                        نقاط الحضور
                        <input
                          type="number"
                          min="0"
                          value={settings.attendancePoints}
                          onChange={(e) =>
                            handleSettingsChange(
                              "attendancePoints",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        خصم الغياب بعذر
                        <input
                          type="number"
                          min="0"
                          value={settings.excusedAbsencePoints}
                          onChange={(e) =>
                            handleSettingsChange(
                              "excusedAbsencePoints",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-700">
                        خصم الغياب بدون عذر
                        <input
                          type="number"
                          min="0"
                          value={settings.unexcusedAbsencePoints}
                          onChange={(e) =>
                            handleSettingsChange(
                              "unexcusedAbsencePoints",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">
                      نقاط التقييمات
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      {Array.from({ length: 10 }, (_, index) => {
                        const scoreKey = `score_${index + 1}`;
                        return (
                          <label
                            key={scoreKey}
                            className="space-y-2 text-sm text-slate-700"
                          >
                            درجة {index + 1} من 10
                            <input
                              type="number"
                              min="0"
                              value={settings[scoreKey] ?? 0}
                              onChange={(e) =>
                                handleSettingsChange(scoreKey, e.target.value)
                              }
                              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">
                      الخصومات
                    </h3>
                    <div className="grid gap-4 md:grid-cols-1 max-w-xs">
                      <label className="space-y-2 text-sm text-slate-700">
                        الخصم المستقطع لكل خطأ
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={settings.errorPenaltyMultiplier}
                          onChange={(e) =>
                            handleSettingsChange(
                              "errorPenaltyMultiplier",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-quran-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-quran-700"
                    >
                      حفظ الإعدادات
                    </button>
                    {settingsStatus && (
                      <span className="text-sm text-emerald-700">
                        {settingsStatus}
                      </span>
                    )}
                  </div>
                </form>
              </section>
            )}

            <section className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    إدارة المكافآت
                  </h2>
                  <p className="text-sm text-slate-500">
                    استخدم لوحة المكافآت المخصصة لإدارة العناصر وطلبات
                    الاستبدال.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/admin/rewards")}
                  className="rounded-3xl bg-quran-700 px-6 py-3 text-sm font-semibold text-white hover:bg-quran-800"
                >
                  الذهاب لإدارة المكافآت
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
