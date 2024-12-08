// Create the context menu for images
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "convertToPng",
    title: "Convert WEBP to PNG",
    contexts: ["image"] // This ensures it's only available for images
  });
});

// Handle the click event on the context menu
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convertToPng" && info.srcUrl.endsWith(".webp")) {
    // Inject a script to convert the image
    browser.tabs.executeScript(tab.id, {
      code: `(${convertImageToPng})('${info.srcUrl}')`
    });
  }
});

// Function to convert the WEBP image to PNG
function convertImageToPng(webpUrl) {
  // Fetch the image from the provided URL
  fetch(webpUrl)
    .then((response) => response.blob())  // Convert to a Blob
    .then((webpBlob) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(webpBlob); // Create an object URL for the image blob

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Convert the image to PNG format
        canvas.toBlob((pngBlob) => {
          const reader = new FileReader();
          reader.onloadend = function () {
            // Send the data URL of the PNG image to the background script
            const dataUrl = reader.result;

            // Extract the original file name without the extension
            const filename = webpUrl.split("/").pop().replace(".webp", ".png");

            // Trigger the download with the same filename but with .png extension
            browser.runtime.sendMessage({
              url: dataUrl,  // The base64 data URL of the PNG image
              name: filename  // Use the original filename with .png extension
            });
          };
          reader.readAsDataURL(pngBlob); // Read the PNG Blob as a base64 string
        }, "image/png");
      };

      img.onerror = () => {
        console.error("Failed to load the WEBP image.");
      };

      img.src = objectUrl;  // Set the source of the image to the object URL
    })
    .catch((err) => console.error("Error fetching WEBP image:", err));
}

// Listener to handle the download request
browser.runtime.onMessage.addListener((message) => {
  if (message.url) {
    // Create a downloadable Blob URL from the base64 string (Data URL)
    const blob = dataURLtoBlob(message.url);
    const blobUrl = URL.createObjectURL(blob);

    // Trigger the download
    browser.downloads.download({
      url: blobUrl,  // The Blob URL for the PNG image
      filename: message.name,  // Use the original filename with .png extension
      saveAs: true, // Ask the user to select a save location
    });
    console.log("Download initiated for:", message.name);
  } else {
    console.error("No URL received in the message.");
  }
});

// Helper function to convert Data URL to Blob
function dataURLtoBlob(dataUrl) {
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    view[i] = byteString.charCodeAt(i);
  }
  return new Blob([view], { type: mimeString });
}
