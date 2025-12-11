// Get URL and text from query parameters
const params = new URLSearchParams(window.location.search);
const url = params.get("url") || "";
const selectedText = params.get("text") || "";

// Initialize popup when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (url) {
    displayURL(url, selectedText);
  } else {
    document.getElementById("status").textContent = "No URL provided";
  }
});

// Listen for the URL from the background script (fallback)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "showPopup") {
    displayURL(msg.url, msg.selectedText);
  }
});

function displayURL(urlToDisplay, selectedTextToDisplay) {
  const urlInput = document.getElementById("urlInput");
  const previewText = document.getElementById("previewText");
  const copyBtn = document.getElementById("copyBtn");
  const closeBtn = document.getElementById("closeBtn");

  // Display the generated URL
  urlInput.value = urlToDisplay;
  
  // Show preview of selected text
  previewText.textContent = selectedTextToDisplay || "No preview available";

  // Copy button functionality
  copyBtn.addEventListener("click", () => {
    urlInput.select();
    document.execCommand("copy");
    
    // Visual feedback
    copyBtn.textContent = "✓ Copied!";
    copyBtn.classList.add("copied");
    
    setTimeout(() => {
      copyBtn.textContent = "📋 Copy";
      copyBtn.classList.remove("copied");
    }, 2000);
  });

  // Close button
  closeBtn.addEventListener("click", () => {
    window.close();
  });

  // Auto-copy on open
  urlInput.select();
  document.execCommand("copy");
}
