import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import PointsSystemGuide from "../components/PointsSystemGuide";
import AnnouncementsBanner from "../components/AnnouncementsBanner";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
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
  const [userStatus, setUserStatus] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupStatus, setGroupStatus] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementStatus, setAnnouncementStatus] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [teacherRes, studentRes] = await Promise.all([
          api.get("/admin/users?role=Teacher"),
          api.get("/admin/users?role=Student"),
        ]);

        const teachersData = teacherRes.data.users || [];
        const studentsData = studentRes.data.users || [];

        setTeachers(teachersData);
        setStudents(studentsData);
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
      setUserStatus("غير قادر على إنشاء المستخدم.");
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
      setGroupStatus("غير قادر على إنشاء المجموعة.");
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
      setAnnouncementStatus("فشل نشر الإعلان. حاول مرة أخرى.");
    }
  };

  const filteredGroupStudents = selectedGroupTeacher
    ? students.filter(
        (student) => String(student.teacherId) === selectedGroupTeacher,
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Navbar role={user?.role} />
      <div className="max-w-7xl mx-auto px-4 py-6">
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
            <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    إدارة المستخدمين
                  </h1>
                  <p className="text-sm text-slate-500">
                    أنشئ معلمين، طلاب وأولياء أمور بسرعة.
                  </p>
                </div>
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
                  <div className="space-y-2 text-sm text-slate-700">
                    <span>اختر أبناء / طلاب الوصي</span>
                    <div className="grid gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-4">
                      {students.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          لا يوجد طلاب مسجلين بعد
                        </p>
                      ) : (
                        students.map((student) => (
                          <label
                            key={student._id}
                            className="inline-flex items-center gap-3"
                          >
                            <input
                              type="checkbox"
                              checked={selectedParentChildren.includes(
                                student._id,
                              )}
                              onChange={() =>
                                handleToggleParentChild(student._id)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-quran-600"
                            />
                            <span>{`${student.firstName} ${student.lastName}`}</span>
                          </label>
                        ))
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
                    <span className="text-sm text-quran-700">{userStatus}</span>
                  )}
                </div>
              </form>
            </section>

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
                      onChange={(e) => setSelectedGroupTeacher(e.target.value)}
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
                    <div className="grid gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-4">
                      {selectedGroupTeacher === "" ? (
                        <p className="text-sm text-slate-500">
                          اختر معلمًا أولاً لرؤية الطلاب
                        </p>
                      ) : filteredGroupStudents.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          لا يوجد طلاب مرتبطين بهذا المعلم
                        </p>
                      ) : (
                        filteredGroupStudents.map((student) => (
                          <label
                            key={student._id}
                            className="inline-flex items-center gap-3"
                          >
                            <input
                              type="checkbox"
                              checked={selectedGroupStudents.includes(
                                student._id,
                              )}
                              onChange={() =>
                                handleToggleGroupStudent(student._id)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-quran-600"
                            />
                            <span>{`${student.firstName} ${student.lastName}`}</span>
                          </label>
                        ))
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
