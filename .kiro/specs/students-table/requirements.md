# Requirements Document

## Introduction

This feature enhances the Students section of the admin dashboard by replacing the current basic table with a fully-featured, interactive Students Table. The table will support pagination, column sorting, bulk actions, CSV export, and an improved inline status-change workflow — all while staying consistent with the existing purple-themed design system.

## Glossary

- **Student**: A registered learner stored in the `studentsStore` with fields: id, fullName, studentId, email, phone, department, year, status, gender, dob, address, enrollmentDate, cafeteria.
- **StudentManagement**: The admin component rendered at `page === "student"` inside `Dashboard.jsx`.
- **StudentsStore**: The Zustand/Context store (`studentsStore.jsx`) that persists student records to `localStorage` under the key `students_admin`.
- **Filtered_Set**: The subset of students that pass the current search query and active filter selections.
- **Bulk_Selection**: A set of student IDs the admin has checked via row checkboxes.
- **Sort_State**: A tuple of `{ column, direction }` where direction is `"asc"` or `"desc"`.

## Requirements

### Requirement 1: Paginated Table Display

**User Story:** As an admin, I want the student list to be paginated, so that large datasets remain readable and performant.

#### Acceptance Criteria

1. THE StudentManagement SHALL display students in a paginated table with a configurable page size.
2. WHEN the Filtered_Set changes, THE StudentManagement SHALL reset to page 1.
3. THE StudentManagement SHALL display a page indicator showing current page and total pages (e.g. "Page 2 of 8").
4. WHEN the total number of students in the Filtered_Set is zero, THE StudentManagement SHALL display an empty-state message instead of the table.
5. THE StudentManagement SHALL support page sizes of 10, 25, and 50 rows, defaulting to 10.

### Requirement 2: Column Sorting

**User Story:** As an admin, I want to sort the table by any column, so that I can quickly find students by name, ID, department, or status.

#### Acceptance Criteria

1. WHEN an admin clicks a sortable column header, THE StudentManagement SHALL sort the Filtered_Set by that column in ascending order.
2. WHEN an admin clicks the same column header again, THE StudentManagement SHALL toggle the sort direction to descending.
3. WHEN an admin clicks a different column header, THE StudentManagement SHALL reset the sort direction to ascending for the new column.
4. THE StudentManagement SHALL visually indicate the active sort column and direction with an arrow icon (↑ / ↓).
5. THE StudentManagement SHALL support sorting on the following columns: Full Name, Student ID, Department, Year, Status.

### Requirement 3: Bulk Actions

**User Story:** As an admin, I want to select multiple students and perform bulk actions, so that I can manage large groups efficiently.

#### Acceptance Criteria

1. THE StudentManagement SHALL render a checkbox in the first column of each row and a "select all on page" checkbox in the header.
2. WHEN an admin checks the header checkbox, THE StudentManagement SHALL add all student IDs on the current page to the Bulk_Selection.
3. WHEN an admin unchecks the header checkbox, THE StudentManagement SHALL remove all student IDs on the current page from the Bulk_Selection.
4. WHEN the Bulk_Selection is non-empty, THE StudentManagement SHALL display a bulk-action toolbar showing the count of selected students and a "Delete Selected" button.
5. WHEN an admin confirms the bulk delete, THE StudentManagement SHALL remove all students in the Bulk_Selection from the StudentsStore and clear the Bulk_Selection.
6. WHEN the page changes, THE StudentManagement SHALL preserve existing Bulk_Selection entries from other pages.

### Requirement 4: CSV Export

**User Story:** As an admin, I want to export the current filtered student list to CSV, so that I can use the data in external tools.

#### Acceptance Criteria

1. THE StudentManagement SHALL display an "Export CSV" button in the list-view header.
2. WHEN an admin clicks "Export CSV", THE StudentManagement SHALL generate a CSV file containing all students in the current Filtered_Set.
3. THE CSV file SHALL include the columns: Full Name, Student ID, Email, Phone, Department, Year, Status, Gender, Date of Birth, Enrollment Date.
4. WHEN the Filtered_Set is empty, THE StudentManagement SHALL disable the "Export CSV" button.
5. THE StudentManagement SHALL trigger a browser file download with the filename `students_export_<YYYY-MM-DD>.csv`.

### Requirement 5: Inline Status Change

**User Story:** As an admin, I want to change a student's enrollment status directly from the table row, so that I don't have to open the full edit form for a simple status update.

#### Acceptance Criteria

1. THE StudentManagement SHALL render the status cell as a clickable dropdown (`<select>`) in each table row.
2. WHEN an admin selects a new status from the row dropdown, THE StudentManagement SHALL immediately update that student's status in the StudentsStore.
3. THE inline status dropdown SHALL support the same status values as the edit form: Active, Inactive, Graduated, Suspended.
4. WHEN the status is updated inline, THE StudentManagement SHALL reflect the new status color badge without requiring a page reload.
