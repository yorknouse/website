// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SymbolsHelp from "@/components/article-editor/SymbolsHelp";

afterEach(cleanup);

function setup() {
  render(<SymbolsHelp id="headline-help" field="headline" />);
  return {
    user: userEvent.setup(),
    button: screen.getByRole("button", {
      name: "Help with < and > in the headline",
    }),
  };
}

describe("SymbolsHelp", () => {
  it("is hidden until asked for", () => {
    setup();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("opens on hover and closes when the pointer leaves", async () => {
    const { user, button } = setup();
    await user.hover(button);
    expect(screen.getByRole("tooltip").textContent).toContain(
      "put a space after <",
    );
    await user.unhover(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("opens on keyboard focus, is linked to the button, and closes on Escape", async () => {
    const { user, button } = setup();
    await user.tab();
    expect(button).toHaveProperty("ariaExpanded", "true");
    const tip = screen.getByRole("tooltip");
    expect(button.getAttribute("aria-describedby")).toBe(tip.id);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("stays open after a tap and closes when focus moves away", () => {
    const { button } = setup();
    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.blur(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("names the field it is about", async () => {
    render(<SymbolsHelp id="excerpt-help" field="strapline" />);
    expect(
      screen.getByRole("button", {
        name: "Help with < and > in the strapline",
      }),
    ).toBeTruthy();
  });
});
