import React from "react";
import { render, screen } from "@testing-library/react";
import { LiquidGlassCard } from "../liquid-glass-card";

describe("LiquidGlassCard", () => {
  it("renders children correctly", () => {
    const testContent = "Test content";
    render(
      <LiquidGlassCard>
        <div>{testContent}</div>
      </LiquidGlassCard>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("applies default glass morphism classes", () => {
    const testContent = "Test content";
    render(<LiquidGlassCard>{testContent}</LiquidGlassCard>);

    const cardElement = screen.getByText(testContent).parentElement;
    expect(cardElement).toHaveClass(
      "relative",
      "overflow-hidden",
      "rounded-xl"
    );
    expect(cardElement).toHaveClass("border", "border-white/10");
    expect(cardElement).toHaveClass("bg-white/[0.05]", "backdrop-blur-md");
    expect(cardElement).toHaveClass("p-4");
  });

  it("merges custom className with default classes", () => {
    const customClass = "my-custom-class";
    const testContent = "Test content";

    render(
      <LiquidGlassCard className={customClass}>{testContent}</LiquidGlassCard>
    );

    const cardElement = screen.getByText(testContent).parentElement;
    expect(cardElement).toHaveClass(customClass);
    expect(cardElement).toHaveClass(
      "relative",
      "overflow-hidden",
      "rounded-xl"
    );
  });

  it("handles complex children components", () => {
    render(
      <LiquidGlassCard>
        <div>
          <h2>Title</h2>
          <p>Description</p>
          <button>Action</button>
        </div>
      </LiquidGlassCard>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders without className prop", () => {
    const testContent = "Test content";
    render(<LiquidGlassCard>{testContent}</LiquidGlassCard>);

    const cardElement = screen.getByText(testContent).parentElement;
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveClass("relative");
  });
});
