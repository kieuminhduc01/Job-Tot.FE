import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function AuthField({
  name,
  label,
  icon: Icon,
  password = false,
  error,
  trailing,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className={`flex min-h-4 items-center justify-between gap-2 mb-1`}>
        <Label
          htmlFor={name}
          className={`gap-[3px] text-[#66718a] normal-case leading-4 text-xs font-semibold`}
        >
          {label} <span className="text-[#ff571b]">*</span>
        </Label>
        {trailing}
      </div>
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-[13px] size-[19px] text-[#6a748a] top-[13px]`}
          aria-hidden="true"
        />
        <Input
          id={name}
          name={name}
          type={password && !visible ? "password" : "text"}
          className={`px-[38px] py-2.5 text-sm text-[#28384f] shadow-[inset_0_1px_2px_#10223504] h-[43px] rounded-lg border border-[#d7dfda] bg-[#F8FAFC] pl-11 placeholder:text-[#8995ab] dark:bg-[#F8FAFC] ${name === "confirmPassword" ? "pr-[33px] text-[13px] md:text-[13px]" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
        {password && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-[5px] h-9 w-[34px] text-[#6a748a] [&_svg]:size-[18px]"
            aria-label={
              visible
                ? `Ẩn ${label.toLowerCase()}`
                : `Hiện ${label.toLowerCase()}`
            }
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-[5px] text-[11px] text-[#c32a21]" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
