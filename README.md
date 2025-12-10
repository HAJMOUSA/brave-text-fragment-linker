# 🧩 Text Fragment Link Generator  
A Brave/Chrome extension that creates `#:~:text=` URLs for highlighted text on any webpage or PDF.  
This allows you to link directly to a specific *highlighted phrase* inside a large document.

---

## 🚀 Features

- Works on **webpages and PDF documents**
- Right-click text → **Generate link**
- Automatically:
  - Extracts highlighted text
  - URL-encodes it
  - Builds a valid `#:~:text=` fragment
  - Copies final link to clipboard
- Zero configuration needed

---

## 🛠 How It Works

Example output URL:

https://example.com/file.pdf#:~:text=Offset%20error%20(B)


When opened in Brave/Chrome:
- The PDF loads
- The browser scrolls to the location of the text
- The phrase becomes highlighted

---

## 📦 Installation (Developer Mode)

1. Open Brave or Chrome  
2. Visit: `brave://extensions`  
3. Enable **Developer Mode**  
4. Click **Load unpacked**  
5. Select this folder

The extension is now active.

---

## 🖱 Usage

1. Highlight any text  
2. Right-click  
3. Choose **Generate link to highlighted text**  
4. The generated URL is copied automatically to your clipboard  
5. Paste anywhere to share the deep link

Alternatively: click the toolbar icon to generate a link for the current selection.

---

## 📁 Project Structure
- `manifest.json`: Extension metadata, permissions, and background service worker.
- `background.js`: Creates the right-click context menu and generates/copies the link.
- `contentScript.js`: Placeholder for future enhancements (e.g., PDF-specific handling).
- `icon.png`: Extension icon (update `manifest.json` if using a different path).

---

## 🔐 Permissions

This extension requests the following permissions:
- `contextMenus`: Add the right-click menu item.
- `activeTab`: Access the current tab’s URL.
- `scripting`: Run the link-generation function in the active tab.
- `clipboardWrite`: Copy the generated link to your clipboard.

---

## 🌐 Supported Browsers

- Brave (Chromium)
- Chrome
- Edge (Chromium)

Note: Text fragments (`#:~:text=`) rely on Chromium support. They may not work in Firefox or Safari.

---

## ⚠️ Limitations

- Works only where text is selectable. Scanned PDFs or images without OCR will not work.
- If a page already contains a fragment in the URL, the new link replaces it.
- Some complex pages may alter selection text (e.g., hidden characters or dynamic content).

---

## 🧰 Troubleshooting

- Ensure you’ve highlighted text before using the context menu.
- If the clipboard write fails, try clicking the context menu again (requires a user gesture).
- For PDFs, verify the text is actually selectable (not an image scan).
- If the icon doesn’t appear, check the `icons` path in `manifest.json`.

---

## 🔒 Privacy

No data is collected or transmitted. All processing happens locally in your browser.

