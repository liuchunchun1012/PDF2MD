# PDF2MD 📄 ➡️ 📝

**由 Liuchunchun 使用 Google Gemini 2.5 Flash 和 React 构建**

PDF2MD 是一款隐私优先的客户端网页应用，可将 PDF 文档（包括大型教科书和扫描文件）转换为干净、结构化的 Markdown 格式。

与传统的基于正则表达式的转换器不同，本工具利用 **Google Gemini 2.5 Flash** 模型的多模态能力，准确识别标题、列表、表格和复杂布局。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Built%20With-React-61DAFB.svg)
![Gemini](https://img.shields.io/badge/Powered%20By-Gemini%202.5-8E75B2.svg)

## ✨ 核心功能

*   **📚 支持大文件（200MB+）：** 大多数 AI 工具限制文件大小为 20MB。PDF2MD 会自动分析、拆分并在本地分块处理大型 PDF，然后合并结果，让您可以转换整本教科书。
*   **⚡ 混合智能模式：**
    *   **电子版PDF（快速）：** 自动提取文本层，只需几秒即可完成转换
    *   **扫描版PDF（完整）：** 使用AI视觉识别，准确处理图片中的文字和布局
*   **🔒 隐私优先：**
    *   **纯客户端：** 无后端服务器。您的文件永远不会离开浏览器（除了直接发送到 Google API 进行处理）。
    *   **自带密钥（BYOK）：** 使用您自己的 Google API 密钥。密钥存储在浏览器的 `localStorage` 中，不会被分享。
*   **🧠 智能格式化：** 正确识别并格式化：
    *   表格（转换为 Markdown 表格）
    *   代码块
    *   标题、列表和章节逻辑
    *   多栏布局（学术论文、教科书等）

## ⚡ 架构：为什么永不崩溃（无排队）

本项目采用**无服务器的客户端架构**。

1.  **无排队：** 与传统的网页转换器不同（用户需要排队等待后端服务器处理文件），PDF2MD 完全在**您的设备上**运行。
2.  **无限扩展性：** 由于处理在您的浏览器中进行，直接连接到 Google API，10,000 名用户可以同时使用本网站而不会相互影响性能。
3.  **稳定性：** 网站本身不会因高流量而"崩溃"，因为它只是一个静态界面。只要 Google API 正常运行，本工具就能工作。

## 💻 系统要求

由于本工具在浏览器的内存（RAM）中处理 PDF，您可以转换的文件大小取决于设备能力。

| 设备类型 | 典型 RAM | 安全文件大小 | 风险等级 |
| :--- | :--- | :--- | :--- |
| **低端/旧手机** | 4GB | **< 30 MB** | 超过 60MB 有高崩溃风险 |
| **标准笔记本** | 8GB | **< 100 MB** | 超过 200MB 有高崩溃风险 |
| **高端 PC / Mac** | 16GB+ | **< 300 MB** | 超过 1GB 有高崩溃风险 |

*注意：大文件（>100MB）需要大量内存，因为浏览器必须加载文件、拆分它并编码为 Base64（增加约 33% 的开销），然后再发送给 AI。*

## 🚀 工作原理

### 智能双模式处理：

1.  **文件分析：** 自动检测PDF类型（电子版 vs 扫描版）
2.  **模式选择：**
    *   **电子版PDF：** 使用 PDF.js 提取文本层 → 发送轻量级文本给 Gemini → 极速格式化
    *   **扫描版PDF：** 使用 pdf-lib 拆分 → 发送图片给 Gemini → AI视觉识别
3.  **智能处理：**
    *   小文件（<10MB）：直接处理
    *   大文件（>10MB）：自动分块，顺序处理，保持上下文
4.  **合并输出：** 拼接结果，呈现预览或下载

## 🛠️ 技术栈

*   **前端框架：** React 19
*   **样式：** Tailwind CSS
*   **AI 模型：** Google Gemini 2.5 Flash（通过 `@google/genai` SDK）
*   **PDF 处理：** 
    *   `pdf-lib`（客户端拆分）
    *   `pdfjs-dist`（文本提取）
*   **构建工具：** Vite / ES Modules

## 📦 安装与使用

### 开发模式（用于调试）：

```bash
git clone https://github.com/liuchunchun1012/PDF2MD.git
cd PDF2MD
npm install
npm run dev
```

### 生产模式（测试大文件）：

```bash
npm run build
npm run preview
```

> **重要提示：** 如果要测试大文件（>50MB），请使用 `npm run preview` 而不是 `npm run dev`，因为开发模式内存占用更大。

### 使用说明：

1.  打开浏览器并输入您的 **Google Gemini API 密钥**。
    *   获取密钥：[Google AI Studio](https://aistudio.google.com/)
    *   免费额度：每分钟10次请求，每天250次请求
2.  上传PDF文件（拖放或点击选择）
3.  点击"Convert"开始转换
4.  转换完成后预览或下载Markdown文件

> **VPN提示：** 如果您所在的地区不支持 Gemini API（例如中国大陆），需要使用 VPN。

## 🛡️ 隐私与安全

本项目设计为完全静态和客户端。
*   **无数据库**
*   **无中间服务器**
*   **您的 API 密钥存储在浏览器的 LocalStorage 中**
*   **PDF 文件在您设备的 RAM 中处理**

## 🌟 性能优化

### 电子版PDF（有文本层）：
- ✅ 速度：极快（几秒内完成）
- ✅ 内存占用：极低
- ✅ 准确率：高

### 扫描版PDF（纯图片）：
- ⚠️ 速度：较慢（取决于文件大小和服务器负载）
- ⚠️ 内存占用：较高
- ✅ 准确率：高（AI视觉识别）

**建议：** 
- 大文件请在使用 `npm run preview` 测试
- 在服务器低峰时段使用（北京时间早上6-9点）
- 优先使用电子版PDF而非扫描版

## 📝 许可证

本项目是开源的，采用 MIT 许可证。

---

# English Version

**Built by Liuchunchun with Google Gemini 2.5 Flash & React**

PDF2MD is a privacy-first, client-side web application that converts PDF documents—including large textbooks and scanned files—into clean, structured Markdown.

Unlike traditional regex-based converters, this tool leverages the multimodal capabilities of **Google's Gemini 2.5 Flash** model to accurately interpret headers, lists, tables, and complex layouts.

## ✨ Key Features

*   **📚 Large File Support (200MB+):** Most AI tools cap files at 20MB. PDF2MD automatically analyzes, splits, and processes large PDFs in chunks locally before merging the results, allowing you to convert entire textbooks.
*   **⚡ Hybrid Intelligent Mode:**
    *   **Digital PDFs (Fast):** Auto-extracts text layer, completes conversion in seconds
    *   **Scanned PDFs (Complete):** Uses AI vision for accurate text and layout recognition
*   **🔒 Privacy First:**
    *   **Client-Side Only:** No backend server. Your files never leave your browser (except to be processed directly by Google's API).
    *   **BYOK (Bring Your Own Key):** You use your own Google API key. Your key is stored locally in your browser's `localStorage` and is never shared.
*   **🧠 Intelligent Formatting:** Correctly identifies and formats:
    *   Tables (converted to Markdown tables)
    *   Code blocks
    *   Headers, Lists, and Section logic
    *   Multi-column layouts (academic papers, textbooks, etc.)

## ⚡ Architecture: Why it Never Crashes (No Queueing)

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

### Intelligent Dual-Mode Processing:

1.  **File Analysis:** Auto-detects PDF type (digital vs scanned)
2.  **Mode Selection:**
    *   **Digital PDFs:** Uses PDF.js to extract text layer → Sends lightweight text to Gemini → Ultra-fast formatting
    *   **Scanned PDFs:** Uses pdf-lib to split → Sends images to Gemini → AI vision recognition
3.  **Smart Processing:**
    *   Small files (<10MB): Direct processing
    *   Large files (>10MB): Auto-chunking, sequential processing, context preservation
4.  **Merge Output:** Stitches results, presents preview or download

## 🛠️ Tech Stack

*   **Frontend Framework:** React 19
*   **Styling:** Tailwind CSS
*   **AI Model:** Google Gemini 2.5 Flash (via `@google/genai` SDK)
*   **PDF Manipulation:** 
    *   `pdf-lib` (Client-side splitting)
    *   `pdfjs-dist` (Text extraction)
*   **Build Tooling:** Vite / ES Modules

## 📦 Installation & Usage

### Development Mode (for debugging):

```bash
git clone https://github.com/liuchunchun1012/PDF2MD.git
cd PDF2MD
npm install
npm run dev
```

### Production Mode (for testing large files):

```bash
npm run build
npm run preview
```

> **Important:** For testing large files (>50MB), use `npm run preview` instead of `npm run dev`, as development mode consumes more memory.

### Usage Instructions:

1.  Open your browser and enter your **Google Gemini API Key**.
    *   Get a key from: [Google AI Studio](https://aistudio.google.com/)
    *   Free tier limits: 10 requests/minute, 250 requests/day
2.  Upload PDF file (drag & drop or click to select)
3.  Click "Convert" to start conversion
4.  Preview or download the Markdown file after completion

> **VPN Note:** If you are in a region where Gemini API is not supported (e.g., China), you may need to use a VPN.

## 🛡️ Privacy & Security

This project is designed to be completely static and client-side.
*   **No database**
*   **No middleman server**
*   **Your API Key is stored in your browser's LocalStorage**
*   **PDF files are processed in your device's RAM**

## 🌟 Performance Optimization

### Digital PDFs (with text layer):
- ✅ Speed: Extremely fast (completes in seconds)
- ✅ Memory usage: Very low
- ✅ Accuracy: High

### Scanned PDFs (image-only):
- ⚠️ Speed: Slower (depends on file size and server load)
- ⚠️ Memory usage: Higher
- ✅ Accuracy: High (AI vision recognition)

**Recommendations:** 
- Test large files using `npm run preview`
- Use during off-peak hours (6-9 AM Beijing Time)
- Prefer digital PDFs over scanned versions

## 📝 License

This project is open-source and available under the MIT License.

---

**Created by Liuchunchun**