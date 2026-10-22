// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import MultiSelect, { type PickerItem } from "./MultiSelect";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const OPTIONS = [
  {
    items: [
      { id: 1, name: "News" },
      { id: 2, name: "Sport" },
    ],
  },
];

function Harness({
  onChange,
  search,
}: {
  onChange: (ids: number[]) => void;
  search?: (q: string) => Promise<PickerItem[]>;
}) {
  const [selected, setSelected] = useState<PickerItem[]>([]);
  return (
    <MultiSelect
      label="Sections"
      selected={selected}
      options={search ? undefined : OPTIONS}
      search={search}
      placeholder="Pick"
      onChange={(ids, items) => {
        setSelected(items);
        onChange(ids);
      }}
    />
  );
}

describe("MultiSelect", () => {
  it("adds a pill for a chosen option and removes it with the x", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "Sections" });
    fireEvent.change(input, { target: { value: "ne" } });
    fireEvent.mouseDown(screen.getByRole("option", { name: "News" }));
    expect(onChange).toHaveBeenLastCalledWith([1]);
    expect(screen.getByRole("button", { name: "Remove News" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove News" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole("button", { name: "Remove News" })).toBeNull();
  });

  it("adds with the keyboard and removes the last pill on Backspace", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "Sections" });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith([2]);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("survives ArrowDown before search results arrive", async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockResolvedValue([{ id: 9, name: "John Smith" }]);
    render(<Harness onChange={vi.fn()} search={search} />);
    const input = screen.getByRole("combobox", { name: "Sections" });
    fireEvent.change(input, { target: { value: "john" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("option", { name: "John Smith" })).toBeTruthy();
  });

  it("shows a search failure instead of No matches", async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockRejectedValue(new Error("boom"));
    render(
      <MultiSelect
        label="Authors"
        selected={[]}
        onChange={vi.fn()}
        search={search}
        searchErrorMessage="Couldn't search authors — try again"
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Authors" }), {
      target: { value: "jo" },
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(
      screen.getByText("Couldn't search authors — try again"),
    ).toBeTruthy();
    expect(screen.queryByText("No matches")).toBeNull();
  });

  it("calls search once, 300ms after typing stops", async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockResolvedValue([{ id: 9, name: "John Smith" }]);
    render(<Harness onChange={vi.fn()} search={search} />);
    const input = screen.getByRole("combobox", { name: "Sections" });
    fireEvent.change(input, { target: { value: "jo" } });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.change(input, { target: { value: "john" } });
    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(search).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("john");
    expect(screen.getByRole("option", { name: "John Smith" })).toBeTruthy();
  });
});
