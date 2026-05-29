---
name: scaffold-node
description: Khởi tạo nhanh 1 project Node.js/script nhỏ chạy được ngay, không thừa.
---

Khi người dùng muốn tạo mới 1 project/script Node:

1. Tạo cấu trúc tối thiểu: `package.json` (type:module, scripts.start), file entry (vd `index.mjs`).
2. KHÔNG cài dependency nếu không thật sự cần (ưu tiên built-in Node).
3. Nếu cần deps: `bash` chạy `npm init -y` rồi `npm install <pkg>`.
4. Viết code rõ ràng, có thể chạy: `node index.mjs`.
5. Chạy thử bằng `bash` để chứng minh nó hoạt động, dán output cho người dùng.
6. Tóm tắt cách chạy.
