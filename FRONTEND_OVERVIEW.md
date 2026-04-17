# ERC-8004 Benchmarking Dashboard - Frontend Overview

Đây là tài liệu tổng quan về kiến trúc và các tính năng chính của Frontend dành cho hệ thống **ERC-8004 Benchmarking Dashboard**.

## 1. Công Nghệ Sử Dụng (Tech Stack)
- **Framework:** Next.js 14 (App Router)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS (áp dụng quy chuẩn thiết kế Shadcn/UI)
- **Kiến trúc:** Feature-Sliced Design (FSD)
- **Giao diện:** Thiết kế theo phong cách OLED Dark Mode (Màu chủ đạo: Gold/Purple, Font: Orbitron & Exo 2)

## 2. Kiến Trúc Dự Án (Feature-Sliced Design)

Toàn bộ dự án được cấu trúc theo triết lý FSD (Feature-Sliced Design), giúp phân tách rõ ràng trách nhiệm của từng module, dễ dàng mở rộng và bảo trì:

```text
erc-8004-benchmarking-fe/
├── app/                  # Chứa hệ thống Routing của Next.js (App Router)
│   ├── (dashboard)/      # Trang chủ (Leaderboard Dashboard)
│   ├── agents/           # Trang hồ sơ chi tiết của từng Agent
│   └── globals.css       # Các biến CSS toàn cục và config Tailwind
├── features/             # Các chức năng mang tính nghiệp vụ (Domain-specific)
│   ├── leaderboard/      # Cụm tính năng xếp hạng (Table, Rising Stars, Filters)
│   └── agent-profile/    # Cụm tính năng hồ sơ (Charts, Heatmap, Hero, Feedback Log)
├── shared/               # Các component dùng chung (Không mang tính nghiệp vụ cụ thể)
│   ├── api/              # API Client (fetch wrappers, type definitions)
│   └── ui/               # Reusable UI Primitives (Sử dụng chuẩn Shadcn/UI: Button, Badge, v.v.)
├── providers/            # Các bọc trạng thái toàn cục (Ví dụ: ChainContext)
└── design-system/        # Tài liệu hướng dẫn quy chuẩn giao diện
```

## 3. Các Trang Cốt Lõi

### A. Trang Chủ: Bảng Xếp Hạng Thông Minh (Smart Leaderboard)
- **Đường dẫn:** `/`
- **Chức năng chính:**
  - **KPI Cards:** Trực quan hóa các thông số tổng quan mạng lưới (Total Agents, Avg Trust Score, v.v).
  - **Rising Stars:** Widget hiển thị các Agent có đà tăng điểm (Score Velocity) đột phá nhất trong 24h qua.
  - **Filter Sidebar:** Hệ thống lọc nhiều lớp theo Open Agent Standard Format (OASF), Domain và trạng thái.
  - **Leaderboard Table:** Bảng xếp hạng linh hoạt, hỗ trợ phân trang và tóm tắt nhanh trạng thái (Success Rate, Tasks).

### B. Hồ Sơ Agent (Agent Profile)
- **Đường dẫn:** `/agents/[chainId]/[id]`
- **Chức năng chính:**
  - **Agent Hero:** Khu vực vinh danh thông tin agent với huy hiệu x402, OASF và trạng thái Active.
  - **Trust Score Chart:** Biểu đồ dòng thời gian thực về sự biến thiên của niềm tin.
  - **Skill Radar Chart:** Đánh giá đa chiều về khả năng của Agent (Thành công, Nhất quán, Độ sâu chuyên môn).
  - **Activity Heatmap:** Biểu đồ hoạt động kiểu GitHub, thể hiện tần suất và chi tiết trạng thái pass/fail theo từng ngày.
  - **Feedback Table:** Bảng ghi nhận chi tiết lịch sử đánh giá phân trang.

## 4. UI/UX & Design System
Hệ thống FE áp dụng quy tắc từ bộ thiết kế thông minh (`ui-ux-pro-max`) để tạo ra trải nghiệm sử dụng cao cấp:
- Xóa bỏ việc code class styles inline thủ công, chuyển toàn bộ sang sử dụng các **UI Primitive Components** (`Badge`, `Button`, `Skeleton`, `Card`).
- Đảm bảo tính minh bạch, phản ứng mượt mà khi người dùng tương tác, đặc biệt tối ưu hiển thị Dark Mode (nền tối `#0F172A`).
- Tích hợp hiệu ứng skeleton loading hiện đại thay vì spinner chờ truyền thống.

## 5. API Layer
Giao tiếp giữa FE và Backend (TrustRank Engine) được module hóa tại `shared/api/client.ts`. 
File này bọc toàn bộ logic call FetchAPI, định nghĩa các interfaces TypeScript nghiêm ngặt, tự động xử lý và trích xuất dữ liệu, giúp các UI component ở features/ tập trung hoàn toàn vào việc render giao diện thay vì xử lý data thuần túy.

## 6. Khởi chạy
Để chạy ứng dụng ở môi trường phát triển:
```bash
npm install
npm run dev
```

*(Sản phẩm đang trong quá trình chuẩn bị cho Phase 6 & Phase 7 - Penalty Log & Admin Simulator)*
