import { createSignal, For, Show } from "solid-js";
import { X } from "lucide-solid"; // uses lucide icons (already supported in Astro)

export default function Gallery(props: {images: string[]}) {
    const [selectedImage, setSelectedImage] = createSignal<string | null>(null);

    const closeModal = (e: MouseEvent) => {
        // prevent closing when clicking on the image itself
        if ((e.target as HTMLElement).classList.contains("modal-overlay")) {
            setSelectedImage(null);
        }
    };

    return (
        <div class="gallery-container">
            {/* Grid of images */}
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

            {/* Modal */}
            <Show when={selectedImage()}>
                <div class="modal-overlay" onClick={closeModal}>
                    <button
                        class="modal-close"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close image"
                    >
                        <X size={28} color="#fff" />
                    </button>
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

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          border-radius: 9999px;
          padding: 0.4rem;
          color: white;
          cursor: pointer;
          transition: background 0.2s ease;
          z-index: 60;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>
    );
}
