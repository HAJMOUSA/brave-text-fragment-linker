chrome.runtime.onMessage.addListener(async msg => {
  if (msg.type !== "copy") return;

  try {
    await navigator.clipboard.writeText(msg.text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = msg.text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }

  chrome.runtime.sendMessage({ type: "copy-complete" });
});
