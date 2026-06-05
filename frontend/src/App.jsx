import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import GroupsOverview from "./pages/GroupsOverview";
import AdminRewardsPage from "./pages/AdminRewardsPage";
import AdminComplaintsPage from "./pages/AdminComplaintsPage";
import AdminCurriculumManager from "./pages/AdminCurriculumManager";
import AdminGamification from "./pages/AdminGamification";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherTraining from "./pages/TeacherTraining";
import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import Leaderboard from "./pages/Leaderboard";
import RewardsStore from "./pages/RewardsStore";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/groups-overview"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <GroupsOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rewards"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <AdminRewardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <AdminComplaintsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/curriculums"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <AdminCurriculumManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gamification"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <AdminGamification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/training"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <TeacherTraining />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={["Parent"]}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute
              allowedRoles={["SuperAdmin", "Teacher", "Student", "Parent"]}
            >
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute
              allowedRoles={["SuperAdmin", "Teacher", "Student", "Parent"]}
            >
              <RewardsStore />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
