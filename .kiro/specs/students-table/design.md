# Design Document: Students Table

## Overview

This design enhances the existing `StudentManagement` component with four new capabilities: pagination, column sorting, bulk actions (bulk delete), CSV export, and inline status editing. All logic is self-contained within `StudentManagement.jsx` and a new pure utility module `studentTableUtils.js`. No new stores or routes are required — the existing `studentsStore` (localStorage-backed Context) is the single source of truth.

The design follows the project's established patterns: inline styles with the purple (`#8b5cf6`) design system, no external UI libraries beyond what is already installed (React, recharts), and no TypeScript.

---

## Architecture

```
Dashboard.jsx
  └── StudentManagement.jsx   ← enhanced (pagination, sort, bulk, export, inline status)
        ├── studentsStore.jsx  ← unchanged (read/write students array)
        └── studentTableUtils.js  ← NEW pure utility functions
              ├── sortStudents(students, column, direction)
              ├── paginateStudents(students, page, pageSize)
              ├── generateCSV(students)
              └── buildExportFilename()
```

The component keeps all interactive state locally with `useState`. No changes to the store API are needed.

---

## Components and Interfaces

### `StudentManagement.jsx` — new state

| State variable | Type | Purpose |
|---|---|---|
| `sortCol` | `string \| null` | Active sort column key |
| `sortDir` | `"asc" \| "desc"` | Sort direction |
| `page` | `number` | Current page (1-indexed) |
| `pageSize` | `number` | Rows per page (10 \| 25 \| 50) |
| `selected` | `Set<number>` | Bulk-selected student IDs |

### `studentTableUtils.js` — exported functions

```js
// Sort an array of student objects by a column key
sortStudents(students, column, direction) → Student[]

// Slice a sorted/filtered array to the current page
paginateStudents(students, page, pageSize) → Student[]

// Convert a student array to a CSV string
generateCSV(students) → string

// Return the export filename with today's date
buildExportFilename() → string   // e.g. "students_export_2026-05-03.csv"
```

### Bulk-action toolbar (conditional render)

Rendered above the table when `selected.size > 0`:

```
[ X students selected ]  [ 🗑️ Delete Selected ]  [ ✕ Clear ]
```

### Pagination controls (below table)

```
[ ← Prev ]  Page 2 of 8  [ Next → ]   Rows per page: [ 10 ▾ ]
```

---

## Data Models

No new data models. The existing student shape is used throughout:

```js
{
  id: number,           // unique key (Date.now() on creation)
  fullName: string,
  studentId: string,    // WOUR/XXXX/YY
  email: string,
  phone: string,
  department: string,
  year: string,
  status: string,       // "Active" | "Inactive" | "Graduated" | "Suspended"
  gender: string,
  dob: string,          // ISO date string
  address: string,
  enrollmentDate: string,
  cafeteria: string,
}
```

### Sort column key mapping

| Display header | Sort key |
|---|---|
| Student (Full Name) | `fullName` |
| ID | `studentId` |
| Department | `department` |
| Year | `year` |
| Status | `status` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pagination correctness

*For any* array of students and any page size P, `paginateStudents` must return at most P students, and the total page count must equal `Math.ceil(students.length / P)`.

**Validates: Requirements 1.1, 1.3**

---

### Property 2: Filter change resets page

*For any* student list and any change to the search query or filter dropdowns, the resulting `page` state must equal 1.

**Validates: Requirements 1.2**

---

### Property 3: Sort toggle round-trip

*For any* student list and any sortable column C:
- Clicking C once produces a list sorted ascending by C.
- Clicking C again produces a list sorted descending by C.
- Clicking a different column D resets direction to ascending for D.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 4: Sort arrow indicator

*For any* active sort state `{ column, direction }`, the rendered column header for `column` must contain `↑` when direction is `"asc"` and `↓` when direction is `"desc"`. All other column headers must contain no arrow.

**Validates: Requirements 2.4**

---

### Property 5: Header checkbox round-trip

*For any* page of students:
- Checking the header checkbox adds all IDs on that page to `selected`.
- Unchecking the header checkbox removes all IDs on that page from `selected`.

**Validates: Requirements 3.2, 3.3**

---

### Property 6: Cross-page selection preservation

*For any* two pages P1 and P2 with disjoint student sets, selecting all on P1 then navigating to P2 must leave the P1 selections intact in `selected`.

**Validates: Requirements 3.6**

---

### Property 7: Bulk delete removes selected

*For any* set of selected student IDs S, after confirming bulk delete:
- No student with an ID in S remains in the store.
- `selected` is empty.

**Validates: Requirements 3.5**

---

### Property 8: CSV generation correctness

*For any* array of students passed to `generateCSV`:
- The first line of the output is the header row containing all required column names.
- Each subsequent line corresponds to exactly one student in the input array.
- Every required field (Full Name, Student ID, Email, Phone, Department, Year, Status, Gender, Date of Birth, Enrollment Date) appears in each data row.

**Validates: Requirements 4.2, 4.3**

---

### Property 9: Inline status update

*For any* student and any valid status value V from `["Active", "Inactive", "Graduated", "Suspended"]`, selecting V from the row dropdown must:
- Update that student's `status` field in the store to V.
- Render the status badge with the color corresponding to V.

**Validates: Requirements 5.2, 5.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Bulk delete with empty selection | "Delete Selected" button is disabled (selection count === 0) |
| Export with empty filtered set | "Export CSV" button is disabled |
| Page out of bounds after filter | `useEffect` clamps `page` to 1 when `filtered.length` changes |
| Invalid sort column key | `sortStudents` returns the original array unchanged |
| Student with missing fields in CSV | Missing fields render as empty string in the CSV cell |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are used. They are complementary:
- **Unit tests** verify specific examples, edge cases, and error conditions.
- **Property-based tests** verify universal properties across randomly generated inputs.

### Property-Based Testing Library

**[fast-check](https://github.com/dubzzz/fast-check)** — the standard PBT library for JavaScript/TypeScript. Install with:

```
npm install --save-dev fast-check
```

Test runner: **Vitest** (already configured in the project via `vite.config.js`).

### Property Test Configuration

- Minimum **100 runs** per property (fast-check default is 100).
- Each test is annotated with a comment referencing the design property.
- Tag format: `// Feature: students-table, Property N: <property_text>`

### Test File Location

`student-management/src/utils/studentTableUtils.test.js`

### Property Tests (one per property)

| Test | Property | fast-check arbitraries |
|---|---|---|
| Pagination correctness | P1 | `fc.array(studentArb)`, `fc.constantFrom(10, 25, 50)` |
| Sort toggle round-trip | P3 | `fc.array(studentArb, {minLength:1})`, `fc.constantFrom(...SORT_COLS)` |
| Sort arrow indicator | P4 | `fc.constantFrom(...SORT_COLS)`, `fc.constantFrom("asc","desc")` |
| Header checkbox round-trip | P5 | `fc.array(studentArb, {minLength:1})` |
| Cross-page selection preservation | P6 | `fc.array(studentArb, {minLength:11})` |
| Bulk delete removes selected | P7 | `fc.array(studentArb, {minLength:1})` |
| CSV generation correctness | P8 | `fc.array(studentArb)` |
| Inline status update | P9 | `studentArb`, `fc.constantFrom("Active","Inactive","Graduated","Suspended")` |

### Unit Tests

- Filter-resets-page (P2): set page to 3, change search, assert page === 1.
- Empty state: 0 students → empty-state div rendered, table absent.
- Export filename: `buildExportFilename()` returns string matching `/^students_export_\d{4}-\d{2}-\d{2}\.csv$/`.
- Export disabled when filtered set is empty.
- Page size default is 10.
