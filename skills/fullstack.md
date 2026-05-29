---
name: fullstack
description: Playbook xây app full-stack (web có backend + frontend) chạy được ngay, tránh các bẫy hay làm treo/hỏng.
---

# Playbook xây app full-stack

Theo đúng thứ tự này. Mục tiêu: app CHẠY ĐƯỢC THẬT, không chỉ "có code".

## 1. Lập kế hoạch theo phase (làm tuần tự, đừng nhồi 1 lần)
1. **Backend trước**: data store + API + dữ liệu mẫu (seed) + test backend.
2. **Frontend sau**: UI gọi vào API đã chạy được.
3. **Kiểm chứng cuối**: khởi động server + gọi thử (curl) trang chủ và API.

## 2. Quy tắc chống treo / chống hỏng (QUAN TRỌNG)
- **CHIA FILE NHỎ < ~180 dòng/file.** Đừng sinh 1 file JS/HTML khổng lồ trong 1 lượt — dễ vượt giới hạn token và làm treo. Ví dụ frontend: tách `core.js`, `auth.js`, `<từng-màn>.js`, `main.js` thay vì 1 `app.js` 700 dòng.
- **Dữ liệu test phải CÔ LẬP.** Test không được ghi đè file dữ liệu thật (vd `data.json`). Cho test dùng file riêng (vd `data.test.json` qua biến môi trường) HOẶC seed lại sau khi test xong. Không để test phá dữ liệu demo.
- **Phục vụ static đúng**: route `/` PHẢI trả `index.html` (đừng để trả 404 vì map nhầm vào thư mục). Kiểm tra: `curl localhost:PORT/` ra 200.
- Sửa file đã có thì dùng edit_file, đừng ghi đè cả file.

## 3. Tự kiểm chứng trước khi báo xong
- Backend: chạy `node --test` (hoặc test tương ứng) tới khi PASS.
- Frontend: `node --check` từng file JS.
- Boot thật: chạy server ở 1 cổng, `curl /` và `curl 1 endpoint API chính` → đúng status. Tắt server sau khi xong.
- **AN TOÀN khi tắt server**: lưu PID (`PORT=4599 node server.mjs & PID=$!`) rồi `kill "$PID"`. KHÔNG `pkill -f node`/`pkill -f server`/`lsof -ti:PORT|xargs kill` — pattern rộng sẽ giết chính harness (cmdline của nó cũng chứa chữ "node"/"server"). Dùng cổng test ít đụng độ (vd 4599) để khỏi phải dọn process cũ.
- Nếu lệnh kiểm chứng do hệ thống đưa vào báo FAIL: đọc kỹ output, sửa đúng nguyên nhân, không đoán mò.

## 4. Tiêu chí UI (nếu có frontend)
- Layout rõ ràng (sidebar/topbar nếu là dashboard), phối màu nhất quán, bo góc, đổ bóng nhẹ, trạng thái dùng badge màu.
- Format số/tiền theo locale (vd VND: `185.000 ₫`).
- Toàn bộ chữ theo ngôn ngữ người dùng yêu cầu.
