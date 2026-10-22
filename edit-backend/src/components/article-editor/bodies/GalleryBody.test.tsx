// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import GalleryBody, { type GalleryImage } from "./GalleryBody";

vi.mock("@/lib/uploadClient", async (orig) => ({
  ...(await orig<typeof import("@/lib/uploadClient")>()),
  uploadFile: vi.fn(),
}));

afterEach(cleanup);

function Harness({ onChange }: { onChange: (i: GalleryImage[]) => void }) {
  const [images, setImages] = useState<GalleryImage[]>([
    { id: 10, caption: "" },
    { id: 20, caption: "" },
  ]);
  return (
    <GalleryBody
      images={images}
      imageUrls={{ 10: "/a.jpg", 20: "/b.jpg" }}
      onChange={(next) => {
        setImages(next);
        onChange(next);
      }}
    />
  );
}

describe("GalleryBody", () => {
  it("removes an image and edits a caption", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove image 10" }));
    fireEvent.change(screen.getByLabelText("Caption for image 20"), {
      target: { value: "A, B" },
    });
    expect(onChange).toHaveBeenLastCalledWith([{ id: 20, caption: "A, B" }]);
  });

  it("shows a caption error under its textarea", () => {
    render(
      <GalleryBody
        images={[{ id: 10, caption: "x" }]}
        onChange={() => {}}
        fieldErrors={{ "body.images.0.caption": "Too long" }}
      />,
    );
    expect(screen.getByText("Too long")).toBeTruthy();
  });
});
