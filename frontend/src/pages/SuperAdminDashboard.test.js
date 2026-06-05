import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SuperAdminDashboard from "./SuperAdminDashboard";
import api from "../api/axios";

jest.mock("../api/axios", () => ({
  post: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

test("renders the SuperAdmin dashboard user management sections", () => {
  render(
    <MemoryRouter>
      <SuperAdminDashboard />
    </MemoryRouter>,
  );

  expect(screen.getByText(/manage users/i)).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /create group/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /create user/i }),
  ).toBeInTheDocument();
});

test("submits a create user form and calls api post", async () => {
  render(
    <MemoryRouter>
      <SuperAdminDashboard />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText(/role/i), {
    target: { value: "Teacher" },
  });
  fireEvent.change(screen.getByPlaceholderText(/first name/i), {
    target: { value: "Sami" },
  });
  fireEvent.change(screen.getByPlaceholderText(/last name/i), {
    target: { value: "Hassan" },
  });
  fireEvent.change(screen.getByPlaceholderText(/teacher@example.com/i), {
    target: { value: "sami@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText(/secure password/i), {
    target: { value: "securepass" },
  });

  fireEvent.click(screen.getByRole("button", { name: /create user/i }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith("/admin/users", {
      role: "Teacher",
      firstName: "Sami",
      lastName: "Hassan",
      email: "sami@example.com",
      password: "securepass",
    });
  });
});

test("submits a create group form and calls api post", async () => {
  render(
    <MemoryRouter>
      <SuperAdminDashboard />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByPlaceholderText(/morning quran group/i), {
    target: { value: "Evening Batch" },
  });
  fireEvent.click(screen.getByLabelText("Student A"));
  fireEvent.click(screen.getByLabelText("Student B"));
  fireEvent.click(screen.getByRole("button", { name: /create group/i }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith("/admin/groups", {
      name: "Evening Batch",
      teacher: "Teacher A",
      students: ["Student A", "Student B"],
    });
  });
});
