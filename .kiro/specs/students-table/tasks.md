# Implementation Plan: Students Table

## Overview

Enhance `StudentManagement.jsx` with pagination, column sorting, bulk delete, CSV export, and inline status editing. Pure logic is extracted into a new `studentTableUtils.js` utility module. Tests use Vitest + fast-check.

## Tasks

- [ ] 1. Set up testing infrastructure
  - Install Vitest and fast-check as dev dependencies
  - Add `test` script to `package.json`: `"test": "vitest run"`
  - Add `vitest.config.js` (or extend `vite.config.js`) with test environment `jsdom`
  - _Requirements: prerequisite for all test tasks_

- [ ] 2. Create `studentTableUtils.js` with core pure functions
  - [ ] 2.1 Implement `sortStudents(students, column, direction)`
    - Sort a copy of the array by the given column key; direction is `"asc"` or `"desc"`
    - Return the original array unchanged for unknown column keys
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.2 Write property test for `sortStudents` (Property 3: Sort toggle round-trip)
    - Use `fc.array(studentArb, {minLength:1})` and `fc.constantFrom(...SORT_COLS)`
    - Assert ascending then descending produces reverse order; different column resets to asc
    - `// Feature: students-table, Property 3: Sort toggle round-trip`
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ] 2.3 Implement `paginateStudents(students, page, pageSize)`
    - Return the correct slice for the given 1-indexed page and page size
    - _Requirements: 1.1, 1.3_

  - [ ] 2.4 Write property test for `paginateStudents` (Property 1: Pagination correctness)
    - Use `fc.array(studentArb)` and `fc.constantFrom(10, 25, 50)`
    - Assert result length ≤ pageSize and total pages = `Math.ceil(n / pageSize)`
    - `// Feature: students-table, Property 1: Pagination correctness`
    - **Validates: Requirements 1.1, 1.3**

  - [ ] 2.5 Implement `generateCSV(students)` and `buildExportFilename()`
    - `generateCSV` returns a CSV string with a header row and one data row per student
    - Required columns: Full Name, Student ID, Email, Phone, Department, Year, Status, Gender, Date of Birth, Enrollment Date
    - `buildExportFilename` returns `students_export_<YYYY-MM-DD>.csv` using today's date
    - _Requirements: 4.2, 4.3, 4.5_

  - [ ] 2.6 Write property test for `generateCSV` (Property 8: CSV generation correctness)
    - Use `fc.array(studentArb)`
    - Assert first line is the header, row count equals input length, all required fields present
    - `// Feature: students-table, Property 8: CSV generation correctness`
    - **Validates: Requirements 4.2, 4.3**

  - [ ] 2.7 Write unit tests for `buildExportFilename` and edge cases
    - Assert filename matches `/^students_export_\d{4}-\d{2}-\d{2}\.csv$/`
    - Assert `generateCSV([])` returns only the header row
    - Assert `generateCSV` handles students with missing optional fields (empty string in cell)
    - **Validates: Requirements 4.5**

- [ ] 3. Checkpoint — ensure all utility tests pass
  - Run `npm test` inside `student-management/`; all tests must be green before proceeding

- [ ] 4. Add sort state and sorted display to `StudentManagement.jsx`
  - [ ] 4.1 Add `sortCol` and `sortDir` state; wire column header clicks to toggle sort state
    - Clicking a new column sets it as active with `"asc"`; clicking the same column toggles direction
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Render sort arrow (↑ / ↓) in the active column header; no arrow on inactive headers
    - _Requirements: 2.4_

  - [ ] 4.3 Write property test for sort arrow indicator (Property 4)
    - For any `{ sortCol, sortDir }` state, assert the correct arrow appears only on the active header
    - `// Feature: students-table, Property 4: Sort arrow indicator`
    - **Validates: Requirements 2.4**

- [ ] 5. Add pagination state and controls to `StudentManagement.jsx`
  - [ ] 5.1 Add `page` (default 1) and `pageSize` (default 10) state
    - Apply `sortStudents` then `paginateStudents` to `filtered` before rendering rows
    - _Requirements: 1.1, 1.5_

  - [ ] 5.2 Add `useEffect` to reset `page` to 1 whenever `search`, `filterDept`, `filterYear`, or `filterStatus` changes
    - _Requirements: 1.2_

  - [ ] 5.3 Write unit test for filter-resets-page (Property 2)
    - Set page to 3, change search string, assert page === 1
    - `// Feature: students-table, Property 2: Filter change resets page`
    - **Validates: Requirements 1.2**

  - [ ] 5.4 Render pagination controls below the table: Prev / Next buttons, "Page X of Y" indicator, and page-size selector (10 / 25 / 50)
    - _Requirements: 1.3, 1.5_

- [ ] 6. Add bulk selection to `StudentManagement.jsx`
  - [ ] 6.1 Add `selected` state (`Set` of student IDs); add checkbox column to table header and each row
    - _Requirements: 3.1_

  - [ ] 6.2 Implement header checkbox: check → select all IDs on current page; uncheck → deselect all on current page
    - _Requirements: 3.2, 3.3_

  - [ ] 6.3 Write property test for header checkbox round-trip (Property 5)
    - For any page of students, check then uncheck header → `selected` is empty for that page
    - `// Feature: students-table, Property 5: Header checkbox round-trip`
    - **Validates: Requirements 3.2, 3.3**

  - [ ] 6.4 Write property test for cross-page selection preservation (Property 6)
    - Select all on page 1, navigate to page 2, assert page-1 IDs still in `selected`
    - `// Feature: students-table, Property 6: Cross-page selection preservation`
    - **Validates: Requirements 3.6**

  - [ ] 6.5 Render bulk-action toolbar when `selected.size > 0`: show count, "Delete Selected" button, and "Clear" button
    - _Requirements: 3.4_

  - [ ] 6.6 Implement bulk delete: on confirm, remove all selected IDs from store and clear `selected`
    - _Requirements: 3.5_

  - [ ] 6.7 Write property test for bulk delete (Property 7)
    - For any selection S, after bulk delete, no ID in S remains in the store and `selected` is empty
    - `// Feature: students-table, Property 7: Bulk delete removes selected`
    - **Validates: Requirements 3.5**

- [ ] 7. Add CSV export to `StudentManagement.jsx`
  - [ ] 7.1 Add "Export CSV" button to the list-view header; disable it when `filtered.length === 0`
    - On click: call `generateCSV(filtered)`, create a Blob, trigger download via a temporary `<a>` element
    - Use `buildExportFilename()` for the download filename
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 8. Add inline status editing to `StudentManagement.jsx`
  - [ ] 8.1 Replace the status badge `<span>` in each table row with a `<select>` dropdown
    - On change, call `setStudents` to update that student's status in the store
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 8.2 Write property test for inline status update (Property 9)
    - For any student and any valid status V, selecting V updates the store and the badge color matches V
    - `// Feature: students-table, Property 9: Inline status update`
    - **Validates: Requirements 5.2, 5.4**

- [ ] 9. Final checkpoint — ensure all tests pass
  - Run `npm test` inside `student-management/`; all tests must be green
  - Verify the UI renders correctly with the dev server

## Notes

- All tasks are required — comprehensive testing from the start
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check with minimum 100 iterations per property
- Unit tests cover specific examples, edge cases, and error conditions
