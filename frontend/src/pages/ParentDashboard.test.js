import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ParentDashboard from "./ParentDashboard";
import api from "../api/axios";

jest.mock("../api/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

test("renders parent dashboard insights and leave request form", async () => {
  api.get.mockResolvedValueOnce({
    data: {
      studentName: "Amina",
      evaluations: [
        { id: "e1", subject: "Recitation", status: "Excellent" },
        { id: "e2", subject: "Memorization", status: "Needs Review" },
      ],
    },
  });

  render(
    <MemoryRouter>
      <ParentDashboard />
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole("heading", { name: /your child/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/amina/i)).toBeInTheDocument();
  expect(screen.getByText(/recitation/i)).toBeInTheDocument();
  expect(screen.getByText(/memorization/i)).toBeInTheDocument();
  expect(screen.getAllByText(/excellent/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/needs review/i).length).toBeGreaterThan(0);
  expect(
    screen.getByRole("button", { name: /submit leave request/i }),
  ).toBeInTheDocument();
});

test("submits leave request form and calls api post", async () => {
  api.get.mockResolvedValueOnce({
    data: {
      studentName: "Khalid",
      evaluations: [],
    },
  });

  render(
    <MemoryRouter>
      <ParentDashboard />
    </MemoryRouter>,
  );

  await screen.findByText(/khalid/i);

  fireEvent.change(screen.getByLabelText(/reason/i), {
    target: { value: "Family event" },
  });
  fireEvent.change(screen.getByLabelText(/date/i), {
    target: { value: "2026-06-01" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /submit leave request/i }),
  );

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith("/parent/leave", {
      reason: "Family event",
      date: "2026-06-01",
    });
  });
});
