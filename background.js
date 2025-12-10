chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateTextFragment",
    title: "Generate link to highlighted text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "generateTextFragment") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: createTextFragmentLink
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: createTextFragmentLink
  });
});

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
