// Listen for the conversion request message
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'convertImage' && message.url.endsWith('.webp')) {
    convertImageToPng(message.url);
  }
});

// Function to convert WEBP image to PNG
function convertImageToPng(webpUrl) {
  fetch(webpUrl)
    .then(response => response.blob())
    .then(webpBlob => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(webpBlob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
          const pngUrl = URL.createObjectURL(blob);
          const filenameWithoutExtension = webpUrl.split('/').pop().replace(/\.webp$/, "");
          // Send the PNG data back to the background script to trigger download
          chrome.runtime.sendMessage({
            pngUrl,
            name: `${filenameWithoutExtension}.png`
          });
        }, "image/png");
      };

      img.onerror = () => {
        console.error("Failed to load the WEBP image.");
      };

      img.src = objectUrl;
    })
    .catch(err => console.error("Error fetching WEBP image:", err));
}
