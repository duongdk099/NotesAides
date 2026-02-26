
/**
 * Image Optimizer Service
 * Uses WASM (via Photon) for high-performance client-side resizing
 * and browser Canvas for high-quality WebP encoding.
 */

// We use a dynamic import approach for the WASM module to avoid issues with SSR
// and to ensure the module is only loaded when needed.

let photon: any = null;
let isInitialized = false;

async function loadPhoton() {
    if (!photon) {
        photon = await import('photon-wasm');
    }

    // Photon-wasm requires explicit initialization
    if (!isInitialized) {
        try {
            // In a Webpack/Next.js environment with asyncWebAssembly,
            // we might need to point it to the correct path or 
            // the package might provide a way to load the wasm binary.
            await photon.initWasm();
            isInitialized = true;
        } catch (e) {
            console.error('Photon initialization failed:', e);
            // Some versions might not need manual init or might already be initialized
            if (photon.initialized) isInitialized = true;
        }
    }
    return photon;
}

export async function optimizeImage(file: File): Promise<File> {
    // 1. Load the WASM module
    const engine = await loadPhoton();

    // 2. Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    try {
        // 3. Create PhotonImage from encoded bytes (JPEG/PNG)
        // Note: Use the static method new_from_byteslice
        let photonImage = engine.PhotonImage.new_from_byteslice(bytes);

        const MAX_WIDTH = 1200; // Reasonable max width for notes
        const width = photonImage.get_width();
        const height = photonImage.get_height();

        // 4. Resize if necessary (Keeping aspect ratio)
        if (width > MAX_WIDTH) {
            const newWidth = MAX_WIDTH;
            const newHeight = (height * MAX_WIDTH) / width;

            // Perform WASM Resize (SamplingFilter.Triangle = 2)
            const resizedImage = engine.resize(photonImage, newWidth, newHeight, 2);
            photonImage.free(); // Free original memory
            photonImage = resizedImage;
        }

        // 5. Convert to WebP using Browser Canvas
        // Photon has a built-in method to get ImageData directly
        const imageData = photonImage.get_image_data();
        const finalWidth = photonImage.get_width();
        const finalHeight = photonImage.get_height();

        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Could not get canvas context');

        ctx.putImageData(imageData, 0, 0);

        // 6. Clean up WASM memory
        photonImage.free();

        // 7. Export as WebP Blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(optimizedFile);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                },
                'image/webp',
                0.85 // Quality setting (85% is the sweet spot)
            );
        });

    } catch (error) {
        console.error('[Optimizer] WASM Processing failed, falling back to original file:', error);
        return file; // Return original file as fallback
    }
}
