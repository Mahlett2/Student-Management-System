import { useState } from "react";

const EMPTY_PROFILE = {
  phone: "", email: "", dob: "", gender: "", nationality: "Ethiopian",
  religion: "", maritalStatus: "Single", bloodGroup: "",
  address: "", city: "", region: "", kebele: "", poBox: "",
  emergencyName: "", emergencyRelation: "", emergencyPhone: "",
  fatherName: "", fatherAlive: "Yes", fatherOccupation: "", fatherPhone: "",
  fatherEducation: "", fatherWorkplace: "",
  motherName: "", motherAlive: "Yes", motherOccupation: "", motherPhone: "",
  motherEducation: "", motherWorkplace: "",
  guardianName: "", guardianRelation: "", guardianPhone: "", guardianAddress: "",
  numberOfSiblings: "", siblingsDetails: "",
  hsName: "", hsCity: "", hsRegion: "",
  grade9From: "", grade9To: "", grade9Score: "",
  grade10From: "", grade10To: "", grade10Score: "",
  grade11From: "", grade11To: "", grade11Score: "",
  grade12From: "", grade12To: "", grade12Score: "",
  esfceCertificate: "", esfceScore: "", esfceYear: "",
  admissionType: "", admissionYear: "", stream: "",
  disability: "None", chronicIllness: "", allergies: "",
};

const TABS = [
  { id: "personal",   icon: "👤", label: "Personal" },
  { id: "family",     icon: "👨‍👩‍👧‍👦", label: "Family" },
  { id: "highschool", icon: "🏫", label: "High School" },
  { id: "admission",  icon: "🎓", label: "Admission" },
  { id: "health",     icon: "🏥", label: "Health" },
];

// Phone: must be +2519 followed by exactly 8 digits
const PHONE_PREFIX = "+2519";
const validatePhone = (v) => {
  if (!v) return null; // optional fields
  if (!v.startsWith(PHONE_PREFIX)) return `Must start with ${PHONE_PREFIX}`;
  const digits = v.slice(PHONE_PREFIX.length);
  if (!/^\d{8}$/.test(digits)) return "Must have exactly 8 digits after +2519";
  return null;
};

const PhoneInput = ({ label, value, onChange, required, error }) => {
  const handleChange = (e) => {
    let raw = e.target.value;
    // Always keep prefix
    if (!raw.startsWith(PHONE_PREFIX)) raw = PHONE_PREFIX;
    // Only allow digits after prefix, max 8
    const after = raw.slice(PHONE_PREFIX.length).replace(/\D/g, "").slice(0, 8);
    onChange(PHONE_PREFIX + after);
  };
  return (
    <div style={{ marginBottom: "0.9rem" }}>
      <label style={lbl}>{label}{required && <span style={{ color: "#EF4444" }}> *</span>}</label>
      <input
        type="text"
        value={value || PHONE_PREFIX}
        onChange={handleChange}
        style={{ ...inp, borderColor: error ? "#EF4444" : "rgba(14,165,233,0.35)" }}
        placeholder="+25191XXXXXXXX"
        maxLength={13}
      />
      {error && <p style={errStyle}>{error}</p>}
      <p style={{ fontSize: "0.7rem", color: "#0369A1", margin: "3px 0 0" }}>Format: +2519 + 8 digits</p>
    </div>
  );
};

export default function Profile() {
  const stored = localStorage.getItem("student");
  const student = stored ? JSON.parse(stored) : {};
  const profileKey = `profile_${student.id || student.username}`;

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(profileKey);
    return saved ? JSON.parse(saved) : EMPTY_PROFILE;
  });

  const isNew = !localStorage.getItem(profileKey);
  const [editing, setEditing] = useState(isNew); // auto-edit if new
  const [tab, setTab] = useState("personal");
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const setPhone = (k) => (v) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    // Required personal fields
    if (!draft.phone || draft.phone === PHONE_PREFIX) e.phone = "Phone number is required";
    else { const pe = validatePhone(draft.phone); if (pe) e.phone = pe; }
    if (!draft.email.trim()) e.email = "Email is required";
    if (!draft.dob) e.dob = "Date of birth is required";
    if (!draft.gender) e.gender = "Gender is required";
    if (!draft.region) e.region = "Region is required";
    if (!draft.city.trim()) e.city = "City is required";
    // Emergency
    if (!draft.emergencyName.trim()) e.emergencyName = "Emergency contact name is required";
    if (!draft.emergencyPhone || draft.emergencyPhone === PHONE_PREFIX) e.emergencyPhone = "Emergency phone is required";
    else { const pe = validatePhone(draft.emergencyPhone); if (pe) e.emergencyPhone = pe; }
    // Father
    if (!draft.fatherName.trim()) e.fatherName = "Father's name is required";
    // Mother
    if (!draft.motherName.trim()) e.motherName = "Mother's name is required";
    // High school
    if (!draft.hsName.trim()) e.hsName = "High school name is required";
    // Validate phone fields
    ["fatherPhone", "motherPhone", "guardianPhone"].forEach((k) => {
      if (draft[k] && draft[k] !== PHONE_PREFIX) {
        const pe = validatePhone(draft[k]);
        if (pe) e[k] = pe;
      }
    });
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      // Switch to first tab with error
      const personalKeys = ["phone","email","dob","gender","region","city","emergencyName","emergencyPhone"];
      const familyKeys = ["fatherName","motherName","fatherPhone","motherPhone","guardianPhone"];
      const hsKeys = ["hsName"];
      if (personalKeys.some((k) => e[k])) setTab("personal");
      else if (familyKeys.some((k) => e[k])) setTab("family");
      else if (hsKeys.some((k) => e[k])) setTab("highschool");
      return;
    }
    setProfile(draft);
    localStorage.setItem(profileKey, JSON.stringify(draft));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); setErrors({}); };

  const data = editing ? draft : profile;

  const F = ({ label, k, type = "text", options, placeholder, required }) => (
    <div style={{ marginBottom: "0.9rem" }}>
      <label style={lbl}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      {editing ? (
        options ? (
          <select style={{ ...inp, borderColor: errors[k] ? "#EF4444" : "rgba(14,165,233,0.35)" }}
            value={data[k]} onChange={set(k)}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} style={{ ...inp, borderColor: errors[k] ? "#EF4444" : "rgba(14,165,233,0.35)" }}
            value={data[k]} onChange={set(k)} placeholder={placeholder || ""} />
        )
      ) : (
        <p style={val}>{data[k] || <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Not provided</span>}</p>
      )}
      {editing && errors[k] && <p style={errStyle}>{errors[k]}</p>}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <h4 style={{ color: "#0C4A6E", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px", paddingBottom: "6px", borderBottom: "2px solid rgba(14,165,233,0.2)" }}>
        {title}
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
        {children}
      </div>
    </div>
  );

  const FullRow = ({ children }) => <div style={{ gridColumn: "1/-1" }}>{children}</div>;

  const PF = ({ label, k, required }) => editing ? (
    <PhoneInput label={label} value={data[k]} onChange={setPhone(k)} required={required} error={errors[k]} />
  ) : (
    <div style={{ marginBottom: "0.9rem" }}>
      <label style={lbl}>{label}</label>
      <p style={val}>{data[k] || <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Not provided</span>}</p>
    </div>
  );

  const errorCount = Object.keys(errors).length;

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: "16px", padding: "20px 24px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.3rem", color: "#0C4A6E", flexShrink: 0 }}>
            {student.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ color: "#E0F2FE", margin: 0, fontSize: "1.15rem", fontWeight: "800" }}>{student.name}</h2>
            <p style={{ color: "#38BDF8", margin: "3px 0 0", fontSize: "0.8rem" }}>{student.studentId} · {student.department} · {student.year}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {editing && isNew && <span style={{ color: "#FCD34D", fontSize: "0.8rem", fontWeight: "600" }}>⚠️ Please complete your profile</span>}
          {!editing ? (
            <button onClick={() => { setDraft(profile); setEditing(true); }} style={editBtn}>✏️ Edit Profile</button>
          ) : (
            <>
              <button onClick={handleSave} style={saveBtn}>💾 Save Profile</button>
              {!isNew && <button onClick={handleCancel} style={cancelBtn}>Cancel</button>}
            </>
          )}
        </div>
      </div>

      {saved && (
        <div style={{ background: "#DCFCE7", color: "#15803D", padding: "10px 16px", borderRadius: "8px", marginBottom: "1rem", fontWeight: "600", fontSize: "0.875rem" }}>
          ✅ Profile saved successfully!
        </div>
      )}

      {editing && errorCount > 0 && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#DC2626", padding: "10px 16px", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: "500" }}>
          ⚠️ {errorCount} required field{errorCount > 1 ? "s are" : " is"} missing or invalid. Please fix them before saving.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", background: "#7DD3FC", padding: "5px", borderRadius: "12px", border: "1px solid rgba(14,165,233,0.2)", flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const tabKeys = {
            personal: ["phone","email","dob","gender","region","city","emergencyName","emergencyPhone"],
            family: ["fatherName","motherName","fatherPhone","motherPhone","guardianPhone"],
            highschool: ["hsName"],
            admission: [], health: [],
          };
          const hasErr = (tabKeys[t.id] || []).some((k) => errors[k]);
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, minWidth: "80px", padding: "9px 8px", border: "none", borderRadius: "8px", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: "600", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
              background: tab === t.id ? "linear-gradient(135deg,#0F172A,#1E293B)" : "transparent",
              color: tab === t.id ? "#38BDF8" : hasErr ? "#EF4444" : "#0369A1",
              boxShadow: tab === t.id ? "0 3px 10px rgba(0,0,0,0.2)" : "none",
              transition: "all 0.18s",
            }}>
              <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
              <span>{t.label}{hasErr ? " ⚠️" : ""}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ background: "#7DD3FC", borderRadius: "14px", padding: "24px", border: "1px solid rgba(14,165,233,0.25)" }}>

        {tab === "personal" && (
          <>
            <Section title="Basic Information">
              <PF label="Phone Number" k="phone" required />
              <F label="Email Address" k="email" type="email" placeholder="student@wu.edu.et" required />
              <F label="Date of Birth" k="dob" type="date" required />
              <F label="Gender" k="gender" options={["", "Male", "Female"]} required />
              <F label="Nationality" k="nationality" />
              <F label="Religion" k="religion" options={["", "Orthodox", "Muslim", "Protestant", "Catholic", "Other"]} />
              <F label="Marital Status" k="maritalStatus" options={["Single", "Married"]} />
              <F label="Blood Group" k="bloodGroup" options={["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            </Section>
            <Section title="Address">
              <F label="Region" k="region" required options={["", "Amhara", "Oromia", "Tigray", "SNNPR", "Afar", "Somali", "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa", "Addis Ababa"]} />
              <F label="City / Woreda" k="city" placeholder="e.g. Kombolcha" required />
              <F label="Kebele" k="kebele" placeholder="e.g. 03" />
              <F label="P.O. Box" k="poBox" />
              <FullRow><F label="Full Address" k="address" placeholder="Street, area..." /></FullRow>
            </Section>
            <Section title="Emergency Contact">
              <F label="Contact Name" k="emergencyName" required />
              <F label="Relationship" k="emergencyRelation" options={["", "Father", "Mother", "Sibling", "Relative", "Guardian", "Other"]} />
              <PF label="Emergency Phone" k="emergencyPhone" required />
            </Section>
          </>
        )}

        {tab === "family" && (
          <>
            <Section title="Father's Information">
              <F label="Father's Full Name" k="fatherName" required />
              <F label="Is Alive?" k="fatherAlive" options={["Yes", "No"]} />
              <F label="Occupation / Job" k="fatherOccupation" placeholder="e.g. Farmer, Teacher" />
              <F label="Workplace" k="fatherWorkplace" />
              <F label="Education Level" k="fatherEducation" options={["", "No formal education", "Primary", "Secondary", "Diploma", "Degree", "Masters", "PhD"]} />
              <PF label="Father's Phone" k="fatherPhone" />
            </Section>
            <Section title="Mother's Information">
              <F label="Mother's Full Name" k="motherName" required />
              <F label="Is Alive?" k="motherAlive" options={["Yes", "No"]} />
              <F label="Occupation / Job" k="motherOccupation" placeholder="e.g. Housewife, Merchant" />
              <F label="Workplace" k="motherWorkplace" />
              <F label="Education Level" k="motherEducation" options={["", "No formal education", "Primary", "Secondary", "Diploma", "Degree", "Masters", "PhD"]} />
              <PF label="Mother's Phone" k="motherPhone" />
            </Section>
            <Section title="Siblings">
              <F label="Number of Siblings" k="numberOfSiblings" type="number" placeholder="e.g. 3" />
              <FullRow>
                <div style={{ marginBottom: "0.9rem" }}>
                  <label style={lbl}>Siblings Details (names, ages, occupations)</label>
                  {editing ? (
                    <textarea style={{ ...inp, minHeight: "80px", resize: "vertical" }}
                      value={data.siblingsDetails} onChange={set("siblingsDetails")}
                      placeholder="e.g. Abebe (22, student), Sara (18, student)..." />
                  ) : (
                    <p style={val}>{data.siblingsDetails || <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Not provided</span>}</p>
                  )}
                </div>
              </FullRow>
            </Section>
            <Section title="Guardian (if different from parents)">
              <F label="Guardian Name" k="guardianName" />
              <F label="Relationship" k="guardianRelation" options={["", "Uncle", "Aunt", "Grandparent", "Sibling", "Other"]} />
              <PF label="Guardian Phone" k="guardianPhone" />
              <F label="Address" k="guardianAddress" />
            </Section>
          </>
        )}

        {tab === "highschool" && (
          <>
            <Section title="High School Information">
              <F label="School Name" k="hsName" required placeholder="e.g. Kombolcha Secondary School" />
              <F label="City / Town" k="hsCity" />
              <F label="Region" k="hsRegion" options={["", "Amhara", "Oromia", "Tigray", "SNNPR", "Afar", "Somali", "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa", "Addis Ababa"]} />
            </Section>
            {[9, 10, 11, 12].map((g) => (
              <Section key={g} title={`Grade ${g}`}>
                <F label="From (Year)" k={`grade${g}From`} placeholder="e.g. 2018" />
                <F label="To (Year)" k={`grade${g}To`} placeholder="e.g. 2019" />
                <F label="Average Score / Result" k={`grade${g}Score`} placeholder="e.g. 85%" />
              </Section>
            ))}
            <Section title="Ethiopian University Entrance Exam (EUEE)">
              <F label="Exam Year" k="esfceYear" placeholder="e.g. 2022" />
              <F label="Total Score" k="esfceScore" placeholder="e.g. 520/600" />
              <F label="Certificate Number" k="esfceCertificate" />
            </Section>
          </>
        )}

        {tab === "admission" && (
          <Section title="University Admission Details">
            <F label="Admission Type" k="admissionType" options={["", "Regular", "Extension", "Distance", "Summer"]} />
            <F label="Admission Year" k="admissionYear" placeholder="e.g. 2022" />
            <F label="Stream / Field" k="stream" options={["", "Natural Science", "Social Science"]} />
          </Section>
        )}

        {tab === "health" && (
          <Section title="Health Information">
            <F label="Disability (if any)" k="disability" options={["None", "Visual impairment", "Hearing impairment", "Physical disability", "Other"]} />
            <F label="Chronic Illness (if any)" k="chronicIllness" placeholder="e.g. Diabetes, Asthma, None" />
            <FullRow><F label="Allergies (if any)" k="allergies" placeholder="e.g. Penicillin, Pollen, None" /></FullRow>
          </Section>
        )}

        {/* Bottom save button */}
        {editing && (
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button onClick={handleSave} style={saveBtn}>💾 Save Profile</button>
            {!isNew && <button onClick={handleCancel} style={cancelBtn}>Cancel</button>}
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#0C4A6E", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" };
const val = { color: "#0C4A6E", fontWeight: "500", margin: 0, fontSize: "0.875rem", padding: "8px 0" };
const inp = { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(14,165,233,0.35)", background: "#BAE6FD", color: "#0C4A6E", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
const errStyle = { color: "#EF4444", fontSize: "0.72rem", margin: "3px 0 0" };
const editBtn = { padding: "9px 18px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#38BDF8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.875rem" };
const saveBtn = { padding: "9px 18px", background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", color: "#0C4A6E", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.875rem" };
const cancelBtn = { padding: "9px 18px", background: "rgba(239,68,68,0.15)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.875rem" };
