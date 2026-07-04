import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SuperAdminDashboard from "./SuperAdminDashboard";
import api from "../api/axios";

jest.mock("../api/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => {
  api.get.mockImplementation((url) => {
    if (
      url === "/admin/settings/gamification" ||
      url === "/settings/gamification"
    ) {
      return Promise.resolve({
        data: {
          settings: {
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
          },
        },
      });
    }

    if (url === "/admin/users?role=Teacher") {
      return Promise.resolve({ data: { users: [] } });
    }

    if (url === "/admin/users?role=Student") {
      return Promise.resolve({
        data: {
          users: [
            {
              _id: "student-1",
              firstName: "Amina",
              lastName: "Khalid",
              email: "amina@example.com",
              phone: "+966500000001",
              teacherId: "teacher-1",
              role: "Student",
            },
          ],
        },
      });
    }

    if (url === "/admin/users?role=Parent") {
      return Promise.resolve({ data: { users: [] } });
    }

    if (url === "/admin/groups") {
      return Promise.resolve({ data: { groups: [] } });
    }

    return Promise.resolve({ data: {} });
  });

  api.post.mockResolvedValue({ data: {} });
  api.put.mockResolvedValue({ data: { user: {} } });
  api.delete.mockResolvedValue({ data: {} });
});

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

test("sends core profile fields when editing a student", async () => {
  render(
    <MemoryRouter>
      <SuperAdminDashboard />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: /الطلاب/i }));
  await waitFor(() =>
    expect(screen.getByText(/إدارة الطلاب/i)).toBeInTheDocument(),
  );
  fireEvent.click(await screen.findByRole("button", { name: /تحرير/i }));

  const firstNameInput =
    screen
      .getAllByPlaceholderText(/الاسم الأول/i)
      .find((input) => input.value === "Amina") ||
    screen.getAllByPlaceholderText(/الاسم الأول/i)[0];
  const lastNameInput =
    screen
      .getAllByPlaceholderText(/الاسم الأخير/i)
      .find((input) => input.value === "Khalid") ||
    screen.getAllByPlaceholderText(/الاسم الأخير/i)[0];
  const emailInput =
    screen
      .getAllByPlaceholderText(/student@example.com/i)
      .find((input) => input.value === "amina@example.com") ||
    screen.getAllByPlaceholderText(/student@example.com/i)[0];
  const phoneInput =
    screen
      .getAllByPlaceholderText(/مثال: \+966512345678/i)
      .find((input) => input.value === "+966500000001") ||
    screen.getAllByPlaceholderText(/مثال: \+966512345678/i)[0];
  const passwordInput = screen.getAllByPlaceholderText(/كلمة مرور جديدة/i)[0];

  fireEvent.change(firstNameInput, { target: { value: "Amal" } });
  fireEvent.change(lastNameInput, { target: { value: "Saleh" } });
  fireEvent.change(emailInput, { target: { value: "amal@example.com" } });
  fireEvent.change(phoneInput, { target: { value: "+966500000002" } });
  fireEvent.change(passwordInput, { target: { value: "newpassword123" } });

  fireEvent.click(screen.getByRole("button", { name: /حفظ التغييرات/i }));

  await waitFor(() => {
    expect(api.put).toHaveBeenCalledWith(
      "/admin/users/students/student-1",
      expect.objectContaining({
        firstName: "Amal",
        lastName: "Saleh",
        email: "amal@example.com",
        phone: "+966500000002",
        password: "newpassword123",
        teacherId: "teacher-1",
        groupId: "",
        parentId: "",
      }),
    );
  });
});
