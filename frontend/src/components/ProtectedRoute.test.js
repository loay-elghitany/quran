import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

afterEach(() => {
  localStorage.clear();
});

test("redirects to login when there is no token", () => {
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <div>Admin Area</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText(/login page/i)).toBeInTheDocument();
});

test("allows access when the user has a valid token and role", () => {
  localStorage.setItem("jwtToken", "mock-token");
  localStorage.setItem("user", JSON.stringify({ role: "SuperAdmin" }));

  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <div>Admin Area</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText(/admin area/i)).toBeInTheDocument();
});
