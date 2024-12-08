function convertWebpToPng(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.crossOrigin = 'anonymous'; // To handle CORS issues
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
            (blob) => {
                const url = URL.createObjectURL(blob);
                chrome.runtime.sendMessage({
                    url,
                    name: `${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
                });
            },
            'image/png',
            1.0
        );
    };

    img.src = image.src;
}

// Automatically detect and convert .webp images on the page
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[src$=".webp"], img[src*=".webp"]');
    images.forEach((image) => {
        convertWebpToPng(image);
    });
});
