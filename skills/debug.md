---
name: debug
description: Quy trình debug có hệ thống — tái hiện lỗi, tìm root cause, sửa tối thiểu, kiểm chứng.
---

Khi gặp lỗi/bug:

1. **Tái hiện**: chạy lệnh gây lỗi bằng `bash`, đọc full stack trace / thông báo lỗi.
2. **Khoanh vùng**: dùng `grep` tìm hàm/biến/file trong thông báo lỗi. `read_file` các chỗ nghi ngờ.
3. **Root cause**: xác định NGUYÊN NHÂN GỐC, không vá triệu chứng. Giải thích ngắn gọn vì sao lỗi.
4. **Sửa tối thiểu**: `edit_file` thay đổi nhỏ nhất đủ khắc phục. Không refactor lan man.
5. **Kiểm chứng**: chạy lại lệnh/test ban đầu bằng `bash`, xác nhận hết lỗi.
6. Báo cáo: lỗi gì, vì sao, sửa gì (1-3 dòng).
