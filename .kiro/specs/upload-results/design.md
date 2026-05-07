# Design Document: Upload Results

## Overview

The Upload Results feature adds a result management panel to the admin dashboard. It follows the same in-page navigation pattern already used by "Add Student" and "Add Teacher" — clicking "Upload Results" on the dashboard swaps the main content area to a `ResultsManagement` component without a full page navigation.

State is managed locally with React `useState` (consistent with the rest of the app). No backend or external storage is used; data lives in component state for this iteration.

---

## Architecture

```
Dashboard (page state: "results")
  └── ResultsManagement
        ├── Upload_Form   (add / edit mode)
        └── Results_Table (list + search/filter)
```

The `Dashboard` component gains a new `page === "results"` branch, identical to how `page === "student"` and `page === "teacher"` work today.

---

## Components and Interfaces

### ResultsManagement

Props: `{ goBack: () => void }`

Internal state:
- `results` — array of Result objects
- `view` — `"list" | "form"`
- `editTarget` — `Result | null` (null = add mode, non-null = edit mode)
- `search` — string
- `filterPeriod` — string

Responsibilities:
- Owns the results array (CRUD operations)
- Passes filtered/searched slice to Results_Table
- Passes editTarget to Upload_Form

### Upload_Form

Props:
```js
{
  initial: Result | null,   // null = add mode
  onSave: (result) => void,
  onCancel: () => void
}
```

Internal state:
- `fields` — `{ studentName, subject, period, grade }`
- `errors` — `{ studentName?, subject?, period?, grade? }`
- `success` — boolean

Responsibilities:
- Validates all fields before calling `onSave`
- Resets after successful save
- Shows per-field error messages and a success banner

### Results_Table

Props:
```js
{
  results: Result[],
  onEdit: (result) => void,
  onDelete: (id) => void,
  search: string,
  onSearchChange: (s) => void,
  filterPeriod: string,
  onFilterChange: (p) => void,
  periods: string[]
}
```

Responsibilities:
- Renders filtered rows
- Exposes Edit / Delete actions per row
- Shows empty-state message when no rows match

---

## Data Models

```js
// Result
{
  id: number,          // Date.now() at creation
  studentName: string, // free-text name of the student
  subject: string,     // e.g. "Web Development"
  period: string,      // e.g. "Semester 1 2025"
  grade: string        // letter grade: A, A-, B+, B, B-, C+, C, D, F
                       // OR numeric string "0"–"100"
}
```

### Grade Validation Rule

A grade is valid if it matches one of:
- Letter grades: `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`, `C-`, `D+`, `D`, `F`
- Numeric: integer string between `0` and `100` inclusive

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Valid submission grows the results list
*For any* results list and any fully-valid Result form submission, after saving the result the list length should increase by exactly one.
**Validates: Requirements 1.2**

Property 2: Invalid/empty submissions are rejected
*For any* form submission where at least one required field is empty or the grade is not a recognised value, the results list should remain unchanged.
**Validates: Requirements 1.3, 1.4**

Property 3: Edit preserves list length
*For any* existing Result and any valid set of updated field values, editing that result should leave the total number of results unchanged.
**Validates: Requirements 3.2**

Property 4: Delete removes exactly one record
*For any* results list with at least one entry, deleting a result by id should reduce the list length by exactly one and the deleted id should no longer appear in the list.
**Validates: Requirements 4.1**

Property 5: Search filter is a subset
*For any* search string and results list, the filtered results should be a subset of the full list (no new records introduced), and every returned record should contain the search string in its studentName or subject field.
**Validates: Requirements 5.1, 5.3**

Property 6: Period filter correctness
*For any* period string and results list, every record returned by the period filter should have a period field exactly equal to the selected period.
**Validates: Requirements 5.2**

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Required field empty on submit | Show inline error below that field; block save |
| Invalid grade value | Show inline error on grade field; block save |
| Delete with empty list | Button not rendered (no rows = no delete targets) |
| Edit non-existent id | Defensive guard; fall back to add mode |

---

## Testing Strategy

### Unit Tests (Vitest)
- Grade validator function: valid letter grades, valid numerics, boundary values (0, 100), invalid strings
- Filter/search logic: empty search returns all, partial match, case-insensitive match
- CRUD reducer functions: add, edit, delete

### Property-Based Tests (fast-check via Vitest)
Each property above maps to one property-based test with a minimum of 100 runs.

Tag format: `// Feature: upload-results, Property N: <title>`

- **Property 1** — generate random valid Result objects, assert list grows by 1
- **Property 2** — generate invalid submissions (empty fields / bad grades), assert list unchanged
- **Property 3** — generate existing list + valid edit payload, assert length unchanged
- **Property 4** — generate list with ≥1 entry, pick random id, assert length −1 and id absent
- **Property 5** — generate random search strings + lists, assert subset + containment
- **Property 6** — generate random period + lists, assert all returned records match period
