import { useState, useEffect } from "react";
import { isValidGrade } from "../utils/gradeValidator";

const EMPTY = { studentName: "", subject: "", period: "", grade: "" };

export default function UploadForm({ initial, onSave, onCancel }) {
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Pre-populate when editing
  useEffect(() => {
    if (initial) {
      setFields({
        studentName: initial.studentName,
        subject: initial.subject,
        period: initial.period,
        grade: initial.grade,
      });
      setErrors({});
      setSuccess(false);
    } else {
      setFields(EMPTY);
    }
  }, [initial]);

  const validate = () => {
    const e = {};
    if (!fields.studentName.trim()) e.studentName = "Student name is required";
    if (!fields.subject.trim()) e.subject = "Subject is required";
    if (!fields.period.trim()) e.period = "Period is required";
    if (!fields.grade.trim()) {
      e.grade = "Grade is required";
    } else if (!isValidGrade(fields.grade)) {
      e.grade = "Invalid grade. Use A–F (with +/-) or a number 0–100";
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    onSave({ ...fields, grade: fields.grade.trim() });
    setFields(EMPTY);
    setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  return (
    <div className="form-box">
      <h2>{initial ? "✏️ Edit Result" : "📤 Upload Result"}</h2>

      {success && (
        <p style={{ color: "green", marginBottom: "0.5rem" }}>
          ✅ Result saved successfully!
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <input
            placeholder="Student Name"
            value={fields.studentName}
            onChange={set("studentName")}
          />
          {errors.studentName && (
            <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.studentName}</p>
          )}
        </div>

        <div>
          <input
            placeholder="Subject"
            value={fields.subject}
            onChange={set("subject")}
          />
          {errors.subject && (
            <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.subject}</p>
          )}
        </div>

        <div>
          <input
            placeholder="Period (e.g. Semester 1 2025)"
            value={fields.period}
            onChange={set("period")}
          />
          {errors.period && (
            <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.period}</p>
          )}
        </div>

        <div>
          <input
            placeholder="Grade (e.g. A, B+, 85)"
            value={fields.grade}
            onChange={set("grade")}
          />
          {errors.grade && (
            <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.grade}</p>
          )}
        </div>

        <button type="submit">💾 Save Result</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: "0.5rem" }}>
          ⬅ Cancel
        </button>
      </form>
    </div>
  );
}
