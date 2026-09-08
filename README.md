# SyllableCloze - Ứng Dụng Học Từ Vựng Tiếng Anh Mobile-First PWA

Ứng dụng web học từ vựng tiếng Anh theo phương pháp:
1. **Phân tách âm tiết chuẩn từ điển quốc tế (Dictionary Syllabification)**: Theo chuẩn Oxford / Cambridge / Merriam-Webster.
2. **Đục lỗ âm tiết (Cloze Test)**: Mỗi từ $N$ âm tiết tự động sinh ra $N$ thẻ flashcard đục lỗ từng âm.
3. **Lặp lại ngắt quãng (SRS SM-2)**: Đánh giá *Quên (<10 phút)*, *Nhớ (1-3 ngày)*, *Dễ (7+ ngày)*.
4. **Viết tay cảm ứng (Kinesthetic Scratchpad)**: Vẽ tay âm tiết còn thiếu trên nền chấm mờ Dot-Grid, chống trượt cuộn trang (`touch-action: none`) và chống vỡ nét màn hình Retina/High-DPI.
5. **Cầu nối AI (Clipboard Bridge)**: Zero-API Backend, sao chép prompt động sang ChatGPT/Gemini và dán kết quả JSON vào ứng dụng.
6. **Local-First**: Toàn bộ dữ liệu lưu trữ trên trình duyệt của người dùng qua IndexedDB (Dexie.js), hỗ trợ xuất/nhập sao lưu file JSON.

---

## 🚀 Cách Sử Dụng Ngay Lập Tức (Không Cần Cài Đặt)

Chỉ cần **click đúp vào file `index.html`** hoặc mở bằng bất kỳ trình duyệt nào (Chrome, Edge, Safari, Firefox).

Ứng dụng đã được tích hợp đầy đủ:
- Bộ từ vựng mẫu khởi tạo sẵn: *imperative, communication, comfortable, necessary, perseverance*.
- Phát âm chuẩn tiếng Anh bản xứ qua **Web Speech API**.
- Bảng viết tay cảm ứng mượt mà.
- Hỗ trợ cài đặt làm ứng dụng PWA trên điện thoại (Add to Home Screen).

---

## 🛠️ Chạy Với Node.js / Vite (Dành Cho Lập Trình Viên)

Nếu bạn muốn chạy môi trường phát triển Vite hoặc build bản production:

```bash
# Cài đặt thư viện
npm install

# Khởi chạy máy chủ phát triển
npm run dev

# Đóng gói bản build
npm run build
```

---

## 📂 Cấu Trúc Dự Án

```
d:/app học từ vựng/
├── index.html              # Bản ứng dụng hoàn chỉnh chạy ngay không cần build
├── package.json            # Cấu hình dự án Node / Vite
├── vite.config.ts          # Cấu hình Vite
├── tsconfig.json           # Cấu hình TypeScript
├── tailwind.config.js      # Cấu hình Tailwind CSS
├── postcss.config.js       # Cấu hình PostCSS
├── public/
│   ├── manifest.json       # PWA Web App Manifest
│   ├── sw.js               # Service Worker lưu bộ nhớ cache offline
│   └── icon.svg            # Biểu tượng ứng dụng SVG
└── src/
    ├── types/index.ts      # Định nghĩa kiểu dữ liệu TypeScript (WordItem, Flashcard, SRS)
    ├── db/index.ts         # Quản lý IndexedDB qua Dexie.js
    ├── utils/
    │   ├── srs.ts          # Thuật toán SM-2 SRS Spaced Repetition
    │   └── aiParser.ts     # Trình tạo Prompt AI & bóc tách JSON chống lỗi
    └── components/
        ├── Header.tsx      # Thanh điều hướng trên cùng & chuyển tab
        ├── Scratchpad.tsx  # Bảng vẽ tay cảm ứng Canvas High-DPI
        ├── StudyScreen.tsx # Màn hình học tập (35% thẻ, 53% canvas, 12% SRS)
        ├── AISyncModal.tsx # Modal đồng bộ AI & Clipboard Bridge
        └── DeckManager.tsx # Quản lý kho từ vựng & sao lưu
```
