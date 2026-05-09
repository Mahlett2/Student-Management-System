# Requirements Document

## Introduction

The Upload Results feature allows admin users to submit and manage student academic results directly from the admin dashboard. Admins can enter grades per student per subject, view existing results, edit or delete entries, and students can subsequently view their grades through the student portal. This feature bridges the admin's result management workflow with the student-facing grades view.

## Glossary

- **Admin**: An authenticated administrator user with access to the admin dashboard
- **Student**: A registered student with an account in the system
- **Result**: A record associating a Student, a Subject, an academic Period, and a Grade
- **Subject**: An academic course or module (e.g., Web Development, Database Systems)
- **Grade**: A letter or numeric score assigned to a Student for a Subject (e.g., A, B+, 85)
- **Period**: An academic term or semester (e.g., "Semester 1 2025")
- **Results_Manager**: The system component responsible for creating, reading, updating, and deleting Result records
- **Upload_Form**: The UI component through which an Admin submits Result data
- **Results_Table**: The UI component that displays existing Result records to the Admin

## Requirements

### Requirement 1: Upload a Student Result

**User Story:** As an admin, I want to upload a student's result for a subject, so that academic performance is recorded in the system.

#### Acceptance Criteria

1. WHEN an admin clicks "Upload Results" on the dashboard, THE Upload_Form SHALL display fields for Student, Subject, Period, and Grade
2. WHEN an admin submits the Upload_Form with all required fields filled, THE Results_Manager SHALL create a new Result record and add it to the results list
3. WHEN an admin submits the Upload_Form with one or more required fields empty, THE Upload_Form SHALL prevent submission and display a validation error message for each missing field
4. WHEN an admin submits the Upload_Form with an invalid Grade value (not a recognised letter grade or number between 0–100), THE Upload_Form SHALL reject the submission and display a descriptive error message
5. WHEN a Result is successfully created, THE Upload_Form SHALL reset all fields and display a success confirmation message

### Requirement 2: View Uploaded Results

**User Story:** As an admin, I want to view all uploaded results in a table, so that I can review and verify the data that has been entered.

#### Acceptance Criteria

1. WHEN an admin opens the Upload Results page, THE Results_Table SHALL display all existing Result records with columns for Student Name, Subject, Period, and Grade
2. WHEN no results exist, THE Results_Table SHALL display an empty-state message indicating no results have been uploaded yet
3. WHEN results exist, THE Results_Table SHALL display each Result record as a distinct row

### Requirement 3: Edit an Existing Result

**User Story:** As an admin, I want to edit a previously uploaded result, so that I can correct mistakes or update grades.

#### Acceptance Criteria

1. WHEN an admin clicks the edit action on a Result row, THE Upload_Form SHALL populate with the existing values of that Result
2. WHEN an admin submits the Upload_Form while editing, THE Results_Manager SHALL update the existing Result record with the new values
3. WHEN an edit is successfully saved, THE Results_Table SHALL reflect the updated values immediately

### Requirement 4: Delete a Result

**User Story:** As an admin, I want to delete a result record, so that I can remove incorrect or duplicate entries.

#### Acceptance Criteria

1. WHEN an admin clicks the delete action on a Result row, THE Results_Manager SHALL remove that Result record from the results list
2. WHEN a Result is deleted, THE Results_Table SHALL no longer display that record

### Requirement 5: Search and Filter Results

**User Story:** As an admin, I want to search and filter the results table, so that I can quickly find specific student records.

#### Acceptance Criteria

1. WHEN an admin types in the search input, THE Results_Table SHALL filter displayed rows to only those where the Student Name or Subject contains the search text
2. WHEN an admin selects a Period from the filter dropdown, THE Results_Table SHALL display only Result records matching that Period
3. WHEN the search input is cleared, THE Results_Table SHALL display all Result records

### Requirement 6: Student Visibility of Results

**User Story:** As a student, I want to view my own grades in the student portal, so that I can track my academic performance.

#### Acceptance Criteria

1. WHEN a student views the Grades page, THE Results_Manager SHALL return only Result records belonging to that student
2. WHEN no results exist for a student, THE Grades page SHALL display a message indicating no grades are available yet
