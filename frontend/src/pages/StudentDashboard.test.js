import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StudentDashboard from "./StudentDashboard";
import api from "../api/axios";

jest.mock("canvas-confetti", () => jest.fn());

jest.mock("../api/axios", () => ({
  get: jest.fn(),
  patch: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(
    "user",
    JSON.stringify({
      firstName: "Salma",
      lastName: "Youssef",
      role: "Student",
    }),
  );

  window.AudioContext = class {
    constructor() {
      this.currentTime = 0;
    }

    createOscillator() {
      return {
        type: "triangle",
        frequency: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      };
    }

    createGain() {
      return {
        gain: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
      };
    }

    get destination() {
      return {};
    }
  };
});

test("renders student dashboard with unlocked avatar and earned badges for high points", async () => {
  api.get.mockImplementation((url) => {
    if (url === "/student/dashboard") {
      return Promise.resolve({
        data: {
          student: {
            firstName: "Salma",
            lastName: "Youssef",
            avatar: "https://api.dicebear.com/6.x/pixel-art/svg?seed=Crown",
            badges: [
              {
                _id: "badgeEntry1",
                awardedAt: "2026-05-22T00:00:00.000Z",
                badgeId: {
                  name: "نجم الاجتهاد",
                  icon: "🌟",
                  description: "مكافأة على الاجتهاد",
                  pointsReward: 100,
                },
              },
            ],
          },
          teacher: { firstName: "Mona", lastName: "Teacher" },
          group: { _id: "group1", name: "حلقة الصبح" },
          evaluations: [],
        },
      });
    }

    if (url === "/student/rewards") {
      return Promise.resolve({
        data: { availablePoints: 150, totalPoints: 520, reservedPoints: 20 },
      });
    }

    if (url === "/student/challenges") {
      return Promise.resolve({ data: { challenges: [] } });
    }

    if (url === "/groups/group1/current-lesson") {
      return Promise.resolve({
        data: {
          curriculum: true,
          lesson: { title: "درس اليوم", task: "مراجعة التجويد" },
          currentLessonIndex: 0,
          totalLessons: 5,
        },
      });
    }

    return Promise.resolve({ data: {} });
  });

  render(
    <MemoryRouter>
      <StudentDashboard />
    </MemoryRouter>,
  );

  expect(await screen.findByText(/إجمالي النقاط/i)).toBeInTheDocument();
  expect(screen.getByText("520")).toBeInTheDocument();
  expect(screen.getByText(/520 نقطة - أنت قائد الآن!/i)).toBeInTheDocument();

  const avatarImage = screen.getByAltText("Avatar");
  expect(avatarImage).toHaveAttribute(
    "src",
    "https://api.dicebear.com/6.x/pixel-art/svg?seed=Crown",
  );

  expect(screen.getByText(/نجم الاجتهاد/i)).toBeInTheDocument();
  expect(screen.getByText(/مكافأة على الاجتهاد/i)).toBeInTheDocument();

  const crownButton = screen.getByRole("button", { name: /تاج/i });
  expect(crownButton).not.toBeDisabled();
});
