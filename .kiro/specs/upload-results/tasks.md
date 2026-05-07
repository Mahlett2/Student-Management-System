# Implementation Plan: Upload Results

## Overview

Implement the Upload Results feature as a `ResultsManagement` component wired into the existing admin dashboard, following the same in-page navigation pattern used by `StudentManagement` and `TeacherManagement`.

## Tasks

- [x] 1. Grade validator utility
  - Create `src/utils/gradeValidator.js` with a `isValidGrade(value)` function
  - Accept letter grades: A, A-, B+, B, B-, C+, C, C-, D+, D, F
  - Accept numeric strings 0–100 (integers only)
  - Return `true` for valid, `false` for invalid
  - _Requirements: 1.4_

- [ ]* 1.1 Write unit tests for gradeValidator
  - Test all valid letter grades
  - Test boundary numerics: "0", "100"
  - Test invalid inputs: empty string, "101", "A+", random strings
  - _Requirements: 1.4_

- [x] 2. Results filter/search utility
  - Create `src/utils/resultsFilter.js` with `filterResults(results, search, period)` function
  - Search filters by studentName or subject (case-insensitive, partial match)
  - Period filter matches exact period string; empty string = no filter
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 2.1 Write property test for search filter (Property 5)
  - `// Feature: upload-results, Property 5: Search filter is a subset`
  - For any search string and results list, filtered results are a subset and every row contains the search text
  - **Validates: Requirements 5.1, 5.3**

- [ ]* 2.2 Write property test for period filter (Property 6)
  - `// Feature: upload-results, Property 6: Period filter correctness`
  - For any period and results list, every returned record has period === selected period
  - **Validates: Requirements 5.2**

- [x] 3. Upload_Form component
  - Create `src/components/UploadForm.jsx`
  - Fields: Student Name, Subject, Period, Grade
  - Props: `{ initial, onSave, onCancel }`
  - Validate all fields on submit using `isValidGrade`; show per-field error messages
  - Show success banner and reset fields after successful save
  - Pre-populate fields when `initial` is non-null (edit mode)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

- [ ]* 3.1 Write property test for valid submission (Property 1)
  - `// Feature: upload-results, Property 1: Valid submission grows the results list`
  - For any valid Result, calling onSave should result in list length +1
  - **Validates: Requirements 1.2**

- [ ]* 3.2 Write property test for invalid submission rejection (Property 2)
  - `// Feature: upload-results, Property 2: Invalid/empty submissions are rejected`
  - For any submission with empty fields or invalid grade, list should be unchanged
  - **Validates: Requirements 1.3, 1.4**

- [x] 4. Results_Table component
  - Create `src/components/ResultsTable.jsx`
  - Props: `{ results, onEdit, onDelete, search, onSearchChange, filterPeriod, onFilterChange, periods }`
  - Render table with columns: Student Name, Subject, Period, Grade, Actions (Edit / Delete)
  - Show empty-state message when results array is empty
  - Render search input and period dropdown above the table
  - _Requirements: 2.1, 2.2, 2.3, 4.2, 5.1, 5.2_

- [ ]* 4.1 Write property test for table renders all records (Property 2.1 consolidated)
  - `// Feature: upload-results, Property 2.1: Table displays all results`
  - For any results list, the rendered table should contain one row per result
  - **Validates: Requirements 2.1, 2.3**

- [x] 5. ResultsManagement component
  - Create `src/components/ResultsManagement.jsx`
  - Own `results`, `view`, `editTarget`, `search`, `filterPeriod` state
  - Implement addResult, updateResult, deleteResult handlers
  - Wire Upload_Form and Results_Table together
  - Props: `{ goBack: () => void }`
  - _Requirements: 1.2, 3.2, 3.3, 4.1_

- [ ]* 5.1 Write property test for edit preserves list length (Property 3)
  - `// Feature: upload-results, Property 3: Edit preserves list length`
  - For any existing result and valid updated values, list length unchanged after edit
  - **Validates: Requirements 3.2**

- [ ]* 5.2 Write property test for delete removes exactly one record (Property 4)
  - `// Feature: upload-results, Property 4: Delete removes exactly one record`
  - For any list with ≥1 entry, deleting by id reduces length by 1 and id is absent
  - **Validates: Requirements 4.1**

- [x] 6. Wire ResultsManagement into Dashboard
  - In `src/pages/Dashboard.jsx`, add `page === "results"` branch
  - Update the "📤 Upload Results" action card `onClick` to `setPage("results")`
  - Render `<ResultsManagement goBack={() => setPage("dashboard")} />`
  - _Requirements: 1.1_

- [ ] 7. Checkpoint — Ensure all tests pass
  - Run the full test suite; fix any failures before proceeding
  - Ensure all implemented properties pass with ≥100 iterations

- [x] 8. Student portal grades integration
  - Update `src/pages/student/Grades.jsx` to read from a shared results store or prop
  - Filter results to only show records where `studentName` matches the logged-in student
  - Show empty-state message when no grades exist for the student
  - _Requirements: 6.1, 6.2_

- [ ]* 8.1 Write property test for student result isolation (Property 6.1)
  - `// Feature: upload-results, Property 6.1: Student sees only own results`
  - For any student and any results list, filtered results contain only that student's records
  - **Validates: Requirements 6.1**

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Run the full test suite; confirm all properties pass
  - Verify the Upload Results flow end-to-end in the dashboard

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check; run with `vitest --run`
