// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convertToPng",
    title: "Convert WEBP to PNG",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convertToPng" && info.srcUrl.endsWith(".webp")) {
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: initiateConversion,
        args: [info.srcUrl]
      });
    }
  }
});

function initiateConversion(webpUrl) {
  chrome.runtime.sendMessage({ action: 'convertImage', url: webpUrl });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.pngUrl && message.name) {
    chrome.downloads.download({
      url: message.pngUrl,
      filename: message.name,
      saveAs: true
    });
  }
});