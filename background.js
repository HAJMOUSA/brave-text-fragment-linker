function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "generateTextFragment",
      title: "Generate link to highlighted text",
      contexts: ["selection"]
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "generateTextFragment") {
    const selection = (info.selectionText || "").trim();

    if (!selection) {
      // Fallback: try to read selection from the page
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: createTextFragmentLink
      });
      return;
    }

    const encoded = encodeURIComponent(selection);

    // Determine base URL, handling Chromium PDF viewer
    let base = (tab.url || "").split("#")[0];
    try {
      const viewerUrl = new URL(tab.url);
      if (viewerUrl.protocol === "chrome-extension:" && viewerUrl.searchParams.has("file")) {
        const originalPdf = viewerUrl.searchParams.get("file") || "";
        base = originalPdf.split("#")[0];
      }
    } catch (e) {
      // Ignore URL parse errors and use tab.url base
    }

    const finalUrl = base + "#:~:text=" + encoded;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copyUrl,
      args: [finalUrl]
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: createTextFragmentLink
  });
});

function copyUrl(url) {
  try {
    navigator.clipboard.writeText(url);
    alert("Link copied:\n" + url);
  } catch (err) {
    alert("Unable to copy. Here is your link:\n" + url);
  }
}

function createTextFragmentLink() {
  const selected = window.getSelection().toString();

  if (!selected) {
    alert("No text selected.");
    return;
  }

  // Encode text fragment
  const encoded = encodeURIComponent(selected.trim());

  // Create final URL
  const url = window.location.href.split("#")[0] + "#:~:text=" + encoded;

  // Copy to clipboard
  navigator.clipboard.writeText(url);

  alert("Link copied:\n" + url);
}
