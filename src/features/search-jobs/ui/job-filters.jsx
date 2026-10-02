import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

export function JobFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <section
      aria-label="Bộ lọc việc làm"
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row"
    >
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="absolute top-3 left-3 size-4 text-muted-foreground"
        />
        <Input
          aria-label="Tìm theo vị trí, công ty hoặc kỹ năng"
          placeholder="Vị trí, công ty hoặc kỹ năng..."
          value={filters.query}
          onChange={(event) => update("query", event.target.value)}
          className="h-10 pl-10"
        />
      </div>
      <select
        aria-label="Địa điểm"
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={filters.location}
        onChange={(event) => update("location", event.target.value)}
      >
        <option value="">Tất cả địa điểm</option>
        <option>Hồ Chí Minh</option>
        <option>Hà Nội</option>
        <option>Remote</option>
      </select>
      <select
        aria-label="Hình thức làm việc"
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={filters.type}
        onChange={(event) => update("type", event.target.value)}
      >
        <option value="">Tất cả hình thức</option>
        <option>Toàn thời gian</option>
        <option>Thực tập</option>
      </select>
      <Button
        variant="outline"
        className="h-10"
        onClick={() => onChange({ query: "", location: "", type: "" })}
      >
        Xóa bộ lọc
      </Button>
    </section>
  );
}
