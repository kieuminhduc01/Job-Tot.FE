import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";

export function ForgotPasswordDialog() {
  const [message, setMessage] = useState("");
  return (
    <Dialog onOpenChange={() => setMessage("")}>
      <DialogTrigger asChild>
        <button type="button" className="text-[13px] font-bold text-[#FF571B]">
          Quên mật khẩu?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khôi phục mật khẩu</DialogTitle>
          <DialogDescription>
            Nhập email liên kết với tài khoản của bạn.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(
              "Chức năng gửi email khôi phục chưa được kết nối. Chưa có email nào được gửi.",
            );
          }}
        >
          <Label htmlFor="recovery-email">Email</Label>
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            required
            placeholder="email@example.com"
          />
          <Button className="border-0 bg-[#ff571b] text-white hover:bg-[#ed4710]">
            Gửi yêu cầu khôi phục
          </Button>
          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
