# PDF2MD 📄 ➡️ 📝

**由 Liuchunchun 使用 Google Gemini 2.5 Flash 和 React 构建**

PDF2MD 是一款隐私优先的客户端网页应用，可将 PDF 文档（包括大型教科书和扫描文件）转换为干净、结构化的 Markdown 格式。

与传统的基于正则表达式的转换器不同，本工具利用 **Google Gemini 2.5 Flash** 模型的多模态能力，准确识别标题、列表、表格和复杂布局。

**Built by Liuchunchun with Google Gemini 2.5 Flash & React**

PDF2MD is a privacy-first, client-side web application that converts PDF documents—including large textbooks and scanned files—into clean, structured Markdown.

Unlike traditional regex-based converters, this tool leverages the multimodal capabilities of **Google's Gemini 2.5 Flash** model to accurately interpret headers, lists, tables, and complex layouts.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Built%20With-React-61DAFB.svg)
![Gemini](https://img.shields.io/badge/Powered%20By-Gemini%202.5-8E75B2.svg)

## ✨ 核心功能

*   **📚 支持大文件（200MB+）：** 大多数 AI 工具限制文件大小为 20MB。PDF2MD 会自动分析、拆分并在本地分块处理大型 PDF，然后合并结果，让您可以转换整本教科书。
*   **🔒 隐私优先：**
    *   **纯客户端：** 无后端服务器。您的文件永远不会离开浏览器（除了直接发送到 Google API 进行处理）。
    *   **自带密钥（BYOK）：** 使用您自己的 Google API 密钥。密钥存储在浏览器的 `localStorage` 中，不会被分享。
*   **🧠 智能格式化：** 正确识别并格式化：
    *   表格（转换为 Markdown 表格）
    *   代码块
    *   标题、列表和章节逻辑

## ✨ Key Features

*   **📚 Large File Support (200MB+):** Most AI tools cap files at 20MB. PDF2MD automatically analyzes, splits, and processes large PDFs in chunks locally before merging the results, allowing you to convert entire textbooks.
*   **🔒 Privacy First:**
    *   **Client-Side Only:** No backend server. Your files never leave your browser (except to be processed directly by Google's API).
    *   **BYOK (Bring Your Own Key):** You use your own Google API key. Your key is stored locally in your browser's `localStorage` and is never shared.
*   **🧠 Intelligent Formatting:** Correctly identifies and formats:
    *   Tables (converted to Markdown tables)
    *   Code blocks
    *   Headers, Lists, and Section logic

## ⚡ 架构：为什么永不崩溃（无排队）

本项目采用**无服务器的客户端架构**。

1.  **无排队：** 与传统的网页转换器不同（用户需要排队等待后端服务器处理文件），PDF2MD 完全在**您的设备上**运行。
2.  **无限扩展性：** 由于处理在您的浏览器中进行，直接连接到 Google API，10,000 名用户可以同时使用本网站而不会相互影响性能。
3.  **稳定性：** 网站本身不会因高流量而"崩溃"，因为它只是一个静态界面。只要 Google API 正常运行，本工具就能工作。

## ⚡ Architecture: Why it never crashes (No Queueing)

This project utilizes a **Serverless, Client-Side Architecture**.

1.  **No Queues:** Unlike traditional web converters where users wait in line for a backend server to process files, PDF2MD runs entirely on **your device**.
2.  **Infinite Scalability:** Because the processing happens in your browser and connects directly to Google's API, 10,000 users can use this site simultaneously without affecting each other's performance.
3.  **Stability:** The site itself cannot "crash" from high traffic because it is just a static interface. As long as Google's API is up, this tool works.

## 💻 系统要求

由于本工具在浏览器的内存（RAM）中处理 PDF，您可以转换的文件大小取决于设备能力。

| 设备类型 | 典型 RAM | 安全文件大小 | 风险等级 |
| :--- | :--- | :--- | :--- |
| **低端/旧手机** | 4GB | **< 30 MB** | 超过 60MB 有高崩溃风险 |
| **标准笔记本** | 8GB | **< 100 MB** | 超过 200MB 有高崩溃风险 |
| **高端 PC / Mac** | 16GB+ | **< 300 MB** | 超过 1GB 有高崩溃风险 |

*注意：大文件（>100MB）需要大量内存，因为浏览器必须加载文件、拆分它并编码为 Base64（增加约 33% 的开销），然后再发送给 AI。*

## 💻 System Requirements

Since this tool processes PDFs in your browser's memory (RAM), the size of the file you can convert depends on your device's capabilities.

| Device Type | Typical RAM | Safe File Size | Risk Level |
| :--- | :--- | :--- | :--- |
| **Low-End / Old Mobile** | 4GB | **< 30 MB** | High crash risk > 60MB |
| **Standard Laptop** | 8GB | **< 100 MB** | High crash risk > 200MB |
| **High-End PC / Mac** | 16GB+ | **< 300 MB** | High crash risk > 1GB |

*Note: Large files (>100MB) require significant memory because browsers must load the file, split it, and encode it to Base64 (which adds ~33% overhead) before sending it to the AI.*

## 🚀 工作原理

1.  **上传：** 您将 PDF 拖放到浏览器中。
2.  **分析：** 应用检查文件大小和设备内存。
    *   *小文件（<10MB）：* 直接发送到 Gemini。
    *   *大文件（>10MB）：* 应用使用 `pdf-lib` 在浏览器中使用顺序内存安全方法将 PDF 拆分为更小的块。
3.  **处理：** 每个块由 Gemini 2.5 Flash 按顺序处理，并使用特定的系统指令来保持上下文。
4.  **合并：** 将生成的 Markdown 片段拼接在一起，并呈现预览或下载。

## 🚀 How It Works

1.  **Upload:** You drop a PDF into the browser.
2.  **Analysis:** The app checks the file size and your device's memory.
    *   *Small files (<10MB):* Sent directly to Gemini.
    *   *Large files (>10MB):* The app uses `pdf-lib` to split the PDF into smaller chunks strictly within the browser using a sequential memory-safe approach.
3.  **Processing:** Each chunk is processed sequentially by Gemini 2.5 Flash with specific system instructions to maintain context.
4.  **Merge:** The resulting Markdown segments are stitched together and presented for preview or download.

## 🛠️ 技术栈

*   **前端框架：** React 19
*   **样式：** Tailwind CSS
*   **AI 模型：** Google Gemini 2.5 Flash（通过 `@google/genai` SDK）
*   **PDF 处理：** `pdf-lib`（客户端拆分）
*   **构建工具：** Vite / ES Modules

## 🛠️ Tech Stack

*   **Frontend Framework:** React 19
*   **Styling:** Tailwind CSS
*   **AI Model:** Google Gemini 2.5 Flash (via `@google/genai` SDK)
*   **PDF Manipulation:** `pdf-lib` (Client-side splitting)
*   **Build Tooling:** Vite / ES Modules

## 📦 安装与使用

1.  克隆仓库：
    ```bash
    git clone https://github.com/liuchunchun1012/PDF2MD.git
    cd PDF2MD
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

3.  运行开发服务器：
    ```bash
    npm run dev
    ```

4.  打开浏览器并输入您的 **Google Gemini API 密钥**。
    *   *注意：您可以从 [Google AI Studio](https://aistudio.google.com/) 获取密钥。*

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

## 🛡️ 隐私与安全

本项目设计为完全静态和客户端。
*   **无数据库。**
*   **无中间服务器。**
*   **您的 API 密钥存储在浏览器的 LocalStorage 中。**
*   **PDF 文件在您设备的 RAM 中处理。**

## 🛡️ Privacy & Security

This project is designed to be completely static and client-side.
*   **No database.**
*   **No middleman server.**
*   **Your API Key is stored in your browser's LocalStorage.**
*   **PDF files are processed in your device's RAM.**

## 📝 许可证

本项目是开源的，采用 MIT 许可证。

## 📝 License

This project is open-source and available under the MIT License.

---

**Created by Liuchunchun**
