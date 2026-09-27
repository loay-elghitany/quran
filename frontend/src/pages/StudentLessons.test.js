import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import StudentLessons from "./StudentLessons";
import api from "../api/axios";

jest.mock("canvas-confetti", () => jest.fn());

jest.mock("../api/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe("StudentLessons", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    window.YT = {
      Player: jest.fn((container, options) => ({
        container,
        options,
        playVideo: jest.fn(),
        destroy: jest.fn(),
        getCurrentTime: jest.fn(() => 0),
        getDuration: jest.fn(() => 100),
      })),
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    };
  });

  test("allows selecting future lessons for a global curriculum and loads its video immediately", async () => {
    api.get.mockResolvedValue({
      data: {
        currentLessonIndex: 0,
        curriculum: {
          _id: "curriculum-1",
          name: "Global Quran",
          isGlobal: true,
          lessons: [
            {
              title: "Lesson 1 - Basics",
              task: "Review the basics",
              videoUrl: "https://youtu.be/abc123def45",
            },
            {
              title: "Lesson 2 - Advanced",
              task: "Practice advanced recitation",
              videoUrl: "https://youtu.be/xyz09876543",
            },
          ],
        },
      },
    });

    api.post.mockResolvedValue({ data: {} });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentLessons />
      </MemoryRouter>,
    );

    const futureLessonButton = await screen.findByRole("button", {
      name: /Lesson 2 - Advanced/i,
    });

    expect(futureLessonButton).not.toBeDisabled();

    await user.click(futureLessonButton);

    await waitFor(() => {
      expect(window.YT.Player).toHaveBeenCalled();
    });

    const videoPlayerCall = window.YT.Player.mock.calls.at(-1);
    expect(videoPlayerCall[1].videoId).toBe("xyz09876543");
    expect(
      await screen.findByRole("heading", { name: /Lesson 2 - Advanced/i }),
    ).toBeInTheDocument();
  });
});
