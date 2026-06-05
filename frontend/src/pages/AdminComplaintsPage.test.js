import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminComplaintsPage from "./AdminComplaintsPage";
import api from "../api/axios";

jest.mock("../api/axios", () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
}));

describe("AdminComplaintsPage", () => {
  const complaints = [
    {
      _id: "complaint-1",
      senderName: "Ahmed Ali",
      senderRole: "Student",
      senderEmail: "ahmed@example.com",
      isAnonymous: false,
      subject: "اختبار الشكوى",
      description: "وصف الشكوى الكامل.",
      shortDescription: "مقتطف من الشكوى.",
      type: "Complaint",
      status: "Pending",
      priority: "Urgent",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "complaint-2",
      senderName: "Sara Omar",
      senderRole: "Teacher",
      isAnonymous: true,
      subject: "اقتراح تحسين",
      description: "يمكن تحسين واجهة المستخدم.",
      type: "Suggestion",
      status: "In_Progress",
      priority: "Medium",
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("user", JSON.stringify({ role: "Admin" }));
  });

  it("renders complaints from the API and shows summary metrics", async () => {
    api.get.mockResolvedValue({ data: { complaints } });

    render(
      <MemoryRouter>
        <AdminComplaintsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/complaints");
      expect(screen.getByText("اختبار الشكوى")).toBeInTheDocument();
      expect(screen.getByText("اقتراح تحسين")).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: /عرض التفاصيل/i }),
      ).toHaveLength(2);
    });

    expect(screen.getByText("المعلّقات")).toBeInTheDocument();
  });

  it("opens complaint details modal when عرض التفاصيل is clicked", async () => {
    api.get.mockResolvedValue({ data: { complaints } });

    render(
      <MemoryRouter>
        <AdminComplaintsPage />
      </MemoryRouter>,
    );

    const detailButtons = await screen.findAllByRole("button", {
      name: /عرض التفاصيل/i,
    });
    await userEvent.click(detailButtons[0]);

    expect(screen.getByText("تفاصيل الطلب")).toBeInTheDocument();
    expect(screen.getByText("وصف الشكوى الكامل.")).toBeInTheDocument();
  });

  it("updates complaint status with API call and shows feedback message", async () => {
    api.get.mockResolvedValue({ data: { complaints } });
    api.put.mockResolvedValue({ data: { message: "تم التحديث" } });

    render(
      <MemoryRouter>
        <AdminComplaintsPage />
      </MemoryRouter>,
    );

    const complaintRow = await screen.findByText("اختبار الشكوى");
    const row = complaintRow.closest("tr");
    const statusSelect = within(row).getByRole("combobox");

    await userEvent.selectOptions(statusSelect, "Resolved");

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/admin/complaints/complaint-1/status",
        { status: "Resolved" },
      );
      expect(statusSelect.value).toBe("Resolved");
    });
  });
});
