import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import LoginPage from "../pages/LoginPage";
import api from "../api/axios";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../api/axios", () => ({
  post: jest.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should render login form with email and password inputs", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("should handle successful login and save JWT token", async () => {
    const user = userEvent.setup();
    const mockToken = "test-jwt-token";
    const mockResponse = {
      data: {
        token: mockToken,
        user: {
          id: "123",
          role: "Student",
          firstName: "Ahmed",
        },
      },
    };

    api.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    await user.type(emailInput, "student@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem("jwtToken")).toBe(mockToken);
    });
  });

  it("should redirect Student to /student after login", async () => {
    const user = userEvent.setup();
    const mockToken = "test-jwt-token";
    const mockResponse = {
      data: {
        token: mockToken,
        user: {
          id: "123",
          role: "Student",
        },
      },
    };

    api.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    await user.type(emailInput, "student@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/student");
    });
  });

  it("should redirect Teacher to /teacher after login", async () => {
    const user = userEvent.setup();
    const mockToken = "test-jwt-token";
    const mockResponse = {
      data: {
        token: mockToken,
        user: {
          id: "123",
          role: "Teacher",
        },
      },
    };

    api.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    await user.type(emailInput, "teacher@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/teacher");
    });
  });

  it("should redirect Parent to /parent after login", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        token: "test-token",
        user: { role: "Parent" },
      },
    };

    api.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.type(screen.getByLabelText(/email/i), "parent@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/parent");
    });
  });

  it("should redirect SuperAdmin to /admin after login", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        token: "test-token",
        user: { role: "SuperAdmin" },
      },
    };

    api.post.mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  it("should display error message on login failure", async () => {
    const user = userEvent.setup();
    const errorMessage = "Invalid credentials.";
    api.post.mockRejectedValue({
      response: {
        data: { message: errorMessage },
      },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("should disable submit button while loading", async () => {
    const user = userEvent.setup();
    api.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({ data: { token: "test", user: { role: "Student" } } }),
            100,
          ),
        ),
    );

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
