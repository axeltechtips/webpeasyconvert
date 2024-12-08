// Add the context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "convertToPng",
        title: "Convert WEBP to PNG",
        contexts: ["image"], // Context menu only for images
    });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "convertToPng" && info.srcUrl.endsWith(".webp")) {
        // Inject a script to convert the image
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: convertImageToPng,
            args: [info.srcUrl],
        });
    } else {
        console.error("Selected image is not a WEBP file.");
    }
});

// Function to convert WEBP to PNG
function convertImageToPng(webpUrl) {
    // Extract the filename from the URL
    const urlParts = webpUrl.split("/");
    const originalFilename = urlParts[urlParts.length - 1];
    const filenameWithoutExtension = originalFilename.replace(/\.webp$/, "");

    fetch(webpUrl)
        .then((response) => response.blob())
        .then((webpBlob) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(webpBlob);

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        const pngUrl = URL.createObjectURL(blob);
                        // Send the PNG data back to the background script
                        chrome.runtime.sendMessage({
                            pngUrl,
                            name: `${filenameWithoutExtension}.png`, // Preserve the original filename
                        });
                    },
                    "image/png",
                    1.0
                );
            };

            img.onerror = () => {
                console.error("Failed to load the WEBP image.");
            };

            img.src = objectUrl;
        })
        .catch((err) => console.error("Error fetching WEBP image:", err));
}

// Listener to handle download requests
chrome.runtime.onMessage.addListener((message) => {
    if (message.pngUrl) {
        chrome.downloads.download({
            url: message.pngUrl,
            filename: message.name,
        });
        console.log("Download initiated for:", message.name);
    } else {
        console.error("No PNG URL received in the message.");
    }
});
