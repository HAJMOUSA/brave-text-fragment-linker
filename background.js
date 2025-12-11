chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "createDeepLink",
    title: "Generate deep link",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Try frameUrl first (for PDFs in viewer), then fall back to tab.url
  let baseURL = info.frameUrl || tab.url;
  
  // Remove fragments and query parameters
  baseURL = baseURL.split("#")[0].split("?")[0];
  
  const selectedText = info.selectionText?.trim() || "";

  console.log("Tab URL:", tab.url);
  console.log("Frame URL:", info.frameUrl);
  console.log("Base URL:", baseURL);
  console.log("Selected text:", selectedText);
  console.log("Selected text length:", selectedText.length);
  
  // Check if this is a PDF
  const isPDF = baseURL.toLowerCase().endsWith(".pdf");

  console.log("Context menu clicked", { isPDF, hasText: !!selectedText, textLength: selectedText.length, baseURL });

  if (!selectedText) {
    alert("No text selected. Please select text and try again.");
    return;
  }

  if (!isPDF) {
    return generateForWebpage(baseURL, selectedText);
  }

  return generateForPDF(baseURL, selectedText);
});

// ----------------------------------------------
// NORMAL WEBPAGES
// ----------------------------------------------
function generateForWebpage(baseURL, selectedText) {
  const text = selectedText || "";
  
  if (!text) { 
    showPopup("", "", "No text selected.");
    return; 
  }

  const link = `${baseURL}#:~:text=${encodeURIComponent(text)}`;
  console.log("Generated webpage link:", link);
  writeToClipboard(link).then(() => {
    openPopup(link, text);
  });
}

// ----------------------------------------------
// PDFs — simplified version
// ----------------------------------------------
async function generateForPDF(baseURL, selectedText) {
  const text = selectedText?.trim() || "";

  if (!text) {
    showPopup("", "", "No text selected. Please select text from the PDF and try again.");
    return;
  }

  const cleaned = normalizePDF(text);
  const link = `${baseURL}#:~:text=${encodeURIComponent(cleaned)}`;

  console.log("Generated PDF link:", link);

  await writeToClipboard(link);
  openPopup(link, cleaned);
}

function normalizePDF(t) {
  // More intelligent PDF text normalization
  const normalized = t
    .replace(/\s+/g, " ")              // Collapse multiple spaces
    .replace(/\s*-\s*$/gm, "-")        // Fix hyphens at end of lines
    .replace(/([a-z])-\s+([a-z])/gi, "$1$2") // Remove hyphens between words on different lines
    .trim();
  
  console.log("Original text length:", t.length);
  console.log("Normalized text length:", normalized.length);
  console.log("Normalized text:", normalized);
  
  return normalized;
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ----------------------------------------------
// Clipboard writer (using offscreen document)
// ----------------------------------------------
async function writeToClipboard(text) {
  await ensureOffscreen();
  await chrome.runtime.sendMessage({ type: "copy", text });
}

async function ensureOffscreen() {
  const url = chrome.runtime.getURL("offscreen.html");

  if ("getContexts" in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [url]
    });
    if (contexts.length > 0) return;
  }

  await chrome.offscreen.createDocument({
    url,
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: "Write deep link"
  });
}

// Listen for copy completion from offscreen document
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "copy-complete") {
    chrome.offscreen.closeDocument().catch(() => {});
  }
});

// Open popup window to display generated URL
function openPopup(url, selectedText) {
  const width = 500;
  const height = 400;
  
  // Get screen dimensions
  chrome.windows.getLastFocused((win) => {
    const left = Math.round(win.left + (win.width - width) / 2);
    const top = Math.round(win.top + (win.height - height) / 2);

    chrome.windows.create({
      url: `popup.html?url=${encodeURIComponent(url)}&text=${encodeURIComponent(selectedText)}`,
      type: "popup",
      width,
      height,
      left,
      top
    });
  });
}

// Fallback popup if window creation fails
function showPopup(url, selectedText, message) {
  alert(message);
}
