# PDF2MD 📄 ➡️ 📝

**Built by Liuchunchun with Google Gemini 2.5 Flash & React**

PDF2MD is a privacy-first, client-side web application that converts PDF documents—including large textbooks and scanned files—into clean, structured Markdown.

Unlike traditional regex-based converters, this tool leverages the multimodal capabilities of **Google's Gemini 2.5 Flash** model to accurately interpret headers, lists, tables, and complex layouts.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Built%20With-React-61DAFB.svg)
![Gemini](https://img.shields.io/badge/Powered%20By-Gemini%202.5-8E75B2.svg)

## ✨ Key Features

*   **📚 Large File Support (200MB+):** Most AI tools cap files at 20MB. PDF2MD automatically analyzes, splits, and processes large PDFs in chunks locally before merging the results, allowing you to convert entire textbooks.
*   **🔒 Privacy First:**
    *   **Client-Side Only:** No backend server. Your files never leave your browser (except to be processed directly by Google's API).
    *   **BYOK (Bring Your Own Key):** You use your own Google API key. Your key is stored locally in your browser's `localStorage` and is never shared.
*   **🧠 Intelligent Formatting:** Correctly identifies and formats:
    *   Tables (converted to Markdown tables)
    *   Code blocks
    *   Headers, Lists, and Section logic

## ⚡ Architecture: Why it never crashes (No Queueing)

This project utilizes a **Serverless, Client-Side Architecture**.

1.  **No Queues:** Unlike traditional web converters where users wait in line for a backend server to process files, PDF2MD runs entirely on **your device**.
2.  **Infinite Scalability:** Because the processing happens in your browser and connects directly to Google's API, 10,000 users can use this site simultaneously without affecting each other's performance.
3.  **Stability:** The site itself cannot "crash" from high traffic because it is just a static interface. As long as Google's API is up, this tool works.

## 💻 System Requirements

Since this tool processes PDFs in your browser's memory (RAM), the size of the file you can convert depends on your device's capabilities.

| Device Type | Typical RAM | Safe File Size | Risk Level |
| :--- | :--- | :--- | :--- |
| **Low-End / Old Mobile** | 4GB | **< 30 MB** | High crash risk > 60MB |
| **Standard Laptop** | 8GB | **< 100 MB** | High crash risk > 200MB |
| **High-End PC / Mac** | 16GB+ | **< 300 MB** | High crash risk > 1GB |

*Note: Large files (>100MB) require significant memory because browsers must load the file, split it, and encode it to Base64 (which adds ~33% overhead) before sending it to the AI.*

## 🚀 How It Works

1.  **Upload:** You drop a PDF into the browser.
2.  **Analysis:** The app checks the file size and your device's memory.
    *   *Small files (<10MB):* Sent directly to Gemini.
    *   *Large files (>10MB):* The app uses `pdf-lib` to split the PDF into smaller chunks strictly within the browser using a sequential memory-safe approach.
3.  **Processing:** Each chunk is processed sequentially by Gemini 2.5 Flash with specific system instructions to maintain context.
4.  **Merge:** The resulting Markdown segments are stitched together and presented for preview or download.

## 🛠️ Tech Stack

*   **Frontend Framework:** React 19
*   **Styling:** Tailwind CSS
*   **AI Model:** Google Gemini 2.5 Flash (via `@google/genai` SDK)
*   **PDF Manipulation:** `pdf-lib` (Client-side splitting)
*   **Build Tooling:** Vite / ES Modules

## 📦 Installation & Usage

1.  Clone the repository:
    ```bash
    git clone https://github.com/liuchunchun1012/PDF2MD.git
    cd PDF2MD
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and enter your **Google Gemini API Key**.
    *   *Note: You can get a key from [Google AI Studio](https://aistudio.google.com/).*

## 🛡️ Privacy & Security

This project is designed to be completely static and client-side.
*   **No database.**
*   **No middleman server.**
*   **Your API Key is stored in your browser's LocalStorage.**
*   **PDF files are processed in your device's RAM.**

## 📝 License

This project is open-source and available under the MIT License.

---

**Created by Liuchunchun**