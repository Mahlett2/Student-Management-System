/**
 * All write operations (create / update / delete) for every entity.
 * Components import from here instead of calling fetch directly.
 */

import { apiPost, apiPut, apiPatch, apiDelete } from "./client";

// ── Students ──────────────────────────────────────────────────────────────

export async function createStudent(data) {
  return apiPost("/students/", {
    full_name:  data.fullName,
    student_id: data.studentId,
    year:       data.year       || "",
    section:    data.section    || "",
    department: data.department || null,
  });
}

export async function updateStudent(id, data) {
  return apiPatch(`/students/${id}/`, {
    full_name:  data.fullName,
    student_id: data.studentId,
    year:       data.year       || "",
    section:    data.section    || "",
    department: data.department || null,
  });
}

export async function deleteStudent(id) {
  return apiDelete(`/students/${id}/`);
}

// ── Teachers ──────────────────────────────────────────────────────────────

export async function createTeacher(data) {
  return apiPost("/teachers/", {
    full_name:        data.fullName,
    initial_password: data.initialPassword,
  });
}

export async function updateTeacher(id, data) {
  return apiPatch(`/teachers/${id}/`, {
    full_name: data.fullName,
  });
}

export async function deleteTeacher(id) {
  return apiDelete(`/teachers/${id}/`);
}

// ── Results ───────────────────────────────────────────────────────────────

export async function createResult(data) {
  return apiPost("/results/", {
    student:         data.student || null,
    student_name:    data.student_name    || data.studentName  || "",
    student_code:    data.student_code    || data.studentCode  || data.studentId || "",
    department:      data.department      || null,
    subject:         data.subject,
    period:          data.period,
    assessment_type: data.assessment_type || data.assessmentType || "Final",
    score:           data.score           ?? null,
    grade:           data.grade           || "",
    // Score components (camelCase — serializer aliases map these to snake_case)
    scoreAssignment: data.scoreAssignment != null && data.scoreAssignment !== "" ? data.scoreAssignment : null,
    scoreTest1:      data.scoreTest1      != null && data.scoreTest1      !== "" ? data.scoreTest1      : null,
    scoreMid:        data.scoreMid        != null && data.scoreMid        !== "" ? data.scoreMid        : null,
    scoreProject:    data.scoreProject    != null && data.scoreProject    !== "" ? data.scoreProject    : null,
    scoreFinal:      data.scoreFinal      != null && data.scoreFinal      !== "" ? data.scoreFinal      : null,
  });
}

export async function updateResult(id, data) {
  return apiPatch(`/results/${id}/`, {
    subject:         data.subject,
    period:          data.period,
    assessment_type: data.assessment_type || data.assessmentType || "Final",
    score:           data.score           ?? null,
    // Score components
    scoreAssignment: data.scoreAssignment != null && data.scoreAssignment !== "" ? data.scoreAssignment : null,
    scoreTest1:      data.scoreTest1      != null && data.scoreTest1      !== "" ? data.scoreTest1      : null,
    scoreMid:        data.scoreMid        != null && data.scoreMid        !== "" ? data.scoreMid        : null,
    scoreProject:    data.scoreProject    != null && data.scoreProject    !== "" ? data.scoreProject    : null,
    scoreFinal:      data.scoreFinal      != null && data.scoreFinal      !== "" ? data.scoreFinal      : null,
  });
}

export async function deleteResult(id) {
  return apiDelete(`/results/${id}/`);
}

// ── Announcements ─────────────────────────────────────────────────────────

export async function createAnnouncement(data) {
  // Map frontend audience labels to backend choices
  const audienceMap = {
    "All": "All",
    "Students Only": "Students",
    "Teachers Only": "Teachers",
    "Students": "Students",
    "Teachers": "Teachers",
    "Admin": "Admin",
  };
  return apiPost("/announcements/", {
    title:    data.title,
    body:     data.body,
    audience: audienceMap[data.audience] || data.audience || "All",
  });
}

export async function updateAnnouncement(id, data) {
  const audienceMap = {
    "All": "All",
    "Students Only": "Students",
    "Teachers Only": "Teachers",
    "Students": "Students",
    "Teachers": "Teachers",
    "Admin": "Admin",
  };
  return apiPatch(`/announcements/${id}/`, {
    title:    data.title,
    body:     data.body,
    audience: audienceMap[data.audience] || data.audience || "All",
  });
}

export async function deleteAnnouncement(id) {
  return apiDelete(`/announcements/${id}/`);
}

// ── Add/Drop requests ─────────────────────────────────────────────────────

export async function approveAddDrop(id) {
  return apiPatch(`/add-drop/${id}/`, { status: "Approved" });
}

export async function rejectAddDrop(id) {
  return apiPatch(`/add-drop/${id}/`, { status: "Rejected" });
}

// ── Cafeteria requests ────────────────────────────────────────────────────

export async function approveCafeteria(id) {
  return apiPatch(`/cafeteria/${id}/`, { status: "Approved" });
}

export async function rejectCafeteria(id) {
  return apiPatch(`/cafeteria/${id}/`, { status: "Rejected" });
}

// ── Attendance sessions ───────────────────────────────────────────────────

export async function createAttendanceSession(data) {
  return apiPost("/attendance/sessions/", {
    date:       data.date,
    class_name: data.className,
    department: data.department || null,
    subject:    data.subject || "",
    records:    (data.records || []).map((r) => ({
      student_name: r.studentName,
      student_code: r.studentId || r.studentCode || "",
      status:       r.status || "Present",
    })),
  });
}

export async function updateAttendanceSession(id, data) {
  return apiPatch(`/attendance/sessions/${id}/`, {
    date:       data.date,
    class_name: data.className,
    department: data.department || null,
    subject:    data.subject || "",
    records:    (data.records || []).map((r) => ({
      student_name: r.studentName,
      student_code: r.studentId || r.studentCode || "",
      status:       r.status || "Present",
    })),
  });
}

export async function deleteAttendanceSession(id) {
  return apiDelete(`/attendance/sessions/${id}/`);
}

// ── Subjects ──────────────────────────────────────────────────────────────

export async function createSubject(data) {
  return apiPost("/subjects/", {
    code:        data.code,
    name:        data.name,
    department:  data.department || null,
    year:        data.year || "",
    semester:    data.semester || "",
    type:        data.type || "",
    credits:     data.credits || null,
    description: data.description || "",
  });
}

export async function updateSubject(id, data) {
  return apiPatch(`/subjects/${id}/`, {
    code:        data.code,
    name:        data.name,
    department:  data.department || null,
    year:        data.year || "",
    semester:    data.semester || "",
    type:        data.type || "",
    credits:     data.credits || null,
    description: data.description || "",
  });
}

export async function deleteSubject(id) {
  return apiDelete(`/subjects/${id}/`);
}

// ── Classes ───────────────────────────────────────────────────────────────

export async function createClass(data) {
  return apiPost("/classes/", {
    name:       data.name,
    section:    data.section || "",
    department: data.department || null,
    year:       data.year || "",
    semester:   data.semester || "",
    capacity:   data.capacity || null,
    room:       data.room || "",
  });
}

export async function updateClass(id, data) {
  return apiPatch(`/classes/${id}/`, {
    name:       data.name,
    section:    data.section || "",
    department: data.department || null,
    year:       data.year || "",
    semester:   data.semester || "",
    capacity:   data.capacity || null,
    room:       data.room || "",
  });
}

export async function deleteClass(id) {
  return apiDelete(`/classes/${id}/`);
}

// ── Timetable ─────────────────────────────────────────────────────────────

export async function createTimetableEntry(data) {
  return apiPost("/timetable/", {
    subject:       data.subject,
    teacher_name:  data.teacher || "",
    department:    data.department || null,
    class_section: data.classSection || "",
    day:           data.day,
    time_slot:     data.timeSlot,
    room:          data.room || "",
  });
}

export async function updateTimetableEntry(id, data) {
  return apiPatch(`/timetable/${id}/`, {
    subject:       data.subject,
    teacher_name:  data.teacher || "",
    department:    data.department || null,
    class_section: data.classSection || "",
    day:           data.day,
    time_slot:     data.timeSlot,
    room:          data.room || "",
  });
}

export async function deleteTimetableEntry(id) {
  return apiDelete(`/timetable/${id}/`);
}
