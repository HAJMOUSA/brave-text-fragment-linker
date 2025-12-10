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

---

## 📁 Project Structure

