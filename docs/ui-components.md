# Shared UI components

Product colours, surfaces and responsive hierarchy live in
`src/shared/ui/vibrant-theme.css`, `visual-system.css` and `responsive.css`.
Use the existing brand, ink, muted, border, purple, sky and mint CSS variables
instead of creating a palette inside each page. CV document content keeps its
own editable design and print styles.

## Selection

Use `Select` from `@/shared/ui/select` for native form controls. All standard
HTML select props, refs, validation, `name`, `value`, `defaultValue`, `disabled`
and option groups work normally. Pass children or an `options` array of
`{ value, label, disabled }`. Supply a visible label or `aria-label`.

```jsx
<Select name="provinceId" value={provinceId} onChange={handleChange} aria-label="Địa điểm">
  <option value="">Tất cả địa điểm</option>
  {provinces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
</Select>
```

The `embedded` variant is for search fields whose surrounding label provides
the border and surface. `density="compact"` is for calendar toolbar controls.
Do not restyle the control on individual pages; keep page CSS to layout.

Use `Combobox` from `@/shared/ui/combobox` when users need to search a long list.
It accepts `options`, `value`, `onChange`, `label` and disabled/error ARIA props.
Each option has `value`, `label`, optional `searchText`, `disabled` and
`filterable:false` for an always-visible clear/all choice. The component owns
filtering, focus and keyboard navigation. `onChange` receives the selected value.

## Tables

Use `Table` and `TableScroll` from `@/shared/ui/table`. Keep business columns and
row rendering on the page. Use native `thead`, `tbody`, `tr`, `th` and `td`, with
`scope="col"` or `scope="row"` where appropriate. Supply a meaningful label.

```jsx
<TableScroll label="Danh sách chiến dịch">
  <Table aria-label="Danh sách chiến dịch">
    <thead><tr><th scope="col">Chiến dịch</th><th scope="col">Trạng thái</th></tr></thead>
    <tbody>{/* Business rows */}</tbody>
  </Table>
</TableScroll>
```

The wrapper constrains horizontal overflow, provides a scroll hint and becomes
keyboard focusable only when the table overflows. Semantic row highlights remain
page-specific. Do not duplicate table surfaces, header styles or scroll wrappers.

## Pagination

Use `Pagination` from `@/shared/ui/pagination` with `page`, `totalPages`,
`onPageChange`, optional `disabled`, `info`, `compact` and `aria-label`.
The caller owns data loading, routing and scroll behavior; the component does
not fetch or change query parameters. Hide it on the page when there is no data.
The shared control uses numbered pages on desktop and a concise position on
mobile, with touch-sized previous/next controls.

## Other primitives

Reuse `Button`, `Input`, `Checkbox`, `Dialog`, `Card`, `Badge`, `Tabs`,
`DatePicker`, `PageBreadcrumb`, `CompanyCard`, `JobListingCard` and
`CareerResources`. Salary calculators share `MoneyInput` and `SummaryRows`
under `shared/ui/salary-calculator`; calculation models remain separate.

`npm run check` checks imports, common primitive usage, hooks and production
build. ESLint rejects raw select/table elements outside their shared component
implementations.
