import { createSignal, For, Show } from "solid-js";

export default function Gallery(props: {images: string[]}) {
    const [selectedImage, setSelectedImage] = createSignal<string | null>(null);

    return (
        <div class="gallery-container">
        <div class="gallery-grid">
        <For each={props.images}>
            {(img) => (
        <img
            src={img}
    alt="Gallery image"
    class="gallery-img"
    onClick={() => setSelectedImage(img)}
    />
)}
    </For>
    </div>

    <Show when={selectedImage()}>
    <div
        class="modal-overlay"
    onClick={() => setSelectedImage(null)}
>
    <img src={selectedImage()!} alt="Full-size" class="modal-image" />
        </div>
        </Show>

        <style>{`
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.5rem;
        }
        .gallery-img {
          width: 100%;
          cursor: pointer;
          border-radius: 0.5rem;
          transition: transform 0.2s ease;
        }
        .gallery-img:hover {
          transform: scale(1.03);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal-image {
          max-width: 90%;
          max-height: 90%;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
);
}
