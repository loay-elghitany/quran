import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage";

describe("LandingPage", () => {
  it("should render the landing page with hero section", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /quran memorization/i }),
    ).toBeInTheDocument();
  });

  it("should display a Quranic verse or Hadith", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>,
    );

    const verse = screen.getByText(/بِسْمِ اللَّهِ/i);
    expect(verse).toBeInTheDocument();
  });

  it("should have a login call-to-action button", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>,
    );

    const loginButton = screen.getByRole("link", { name: /login/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute("href", "/login");
  });

  it("should have responsive design with proper spacing", () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>,
    );

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("min-h-screen");
  });
});
