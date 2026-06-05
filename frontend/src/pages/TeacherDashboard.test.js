import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TeacherDashboard from "./TeacherDashboard";
import api from "../api/axios";

jest.mock("../api/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(
    "user",
    JSON.stringify({ firstName: "Mona", lastName: "Teacher", role: "Teacher" }),
  );
});

test("teacher submits a daily evaluation and sees success feedback", async () => {
  api.get.mockImplementation((url) => {
    if (url === "/teacher/dashboard") {
      return Promise.resolve({
        data: {
          groups: [
            {
              _id: "group1",
              name: "حلقة الفجر",
              studentIds: [
                {
                  _id: "student1",
                  firstName: "Ali",
                  lastName: "Ahmed",
                  evaluationStreak: { count: 2 },
                },
              ],
            },
          ],
        },
      });
    }

    if (url === "/teacher/badges") {
      return Promise.resolve({ data: { badges: [] } });
    }

    if (url.startsWith("/groups/") && url.endsWith("/current-lesson")) {
      return Promise.resolve({
        data: {
          curriculum: null,
          lesson: null,
          message: "لا يوجد درس اليوم",
        },
      });
    }

    return Promise.resolve({ data: {} });
  });

  api.post.mockResolvedValue({ data: {} });

  render(
    <MemoryRouter>
      <TeacherDashboard />
    </MemoryRouter>,
  );

  expect(await screen.findByText("لوحة تحكم المعلم")).toBeInTheDocument();
  expect(screen.getByText("Ali Ahmed")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /إضافة تقييم اليوم/i }));

  expect(screen.getByText(/إضافة تقييم يومي/i)).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText(/مثال: الفاتحة/i), {
    target: { value: "البقرة" },
  });

  fireEvent.click(screen.getByRole("button", { name: /حفظ التقييم/i }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith(
      "/teacher/evaluations",
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "multipart/form-data",
        }),
      }),
    );
  });

  expect(
    await screen.findByText("تم حفظ التقييم اليومي بنجاح."),
  ).toBeInTheDocument();
  expect(screen.queryByText(/إضافة تقييم يومي/i)).not.toBeInTheDocument();
});
