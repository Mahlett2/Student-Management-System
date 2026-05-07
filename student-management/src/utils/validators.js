/**
 * Student ID format: WOUR/XXXX/YY
 * - Must start with "WOUR" (uppercase only)
 * - "/" separator
 * - Exactly 4 digits
 * - "/" separator
 * - Exactly 2 digits
 * Example: WOUR/1234/15
 */
export const STUDENT_ID_REGEX = /^WOUR\/\d{4}\/\d{2}$/;

export function validateStudentId(id) {
  if (!id || !id.trim()) return "Student ID is required";
  if (!STUDENT_ID_REGEX.test(id.trim())) return "Format must be WOUR/XXXX/YY (e.g. WOUR/1234/15)";
  return null;
}

/**
 * Strong password: min 8 chars, at least one uppercase, one lowercase,
 * one digit, one special character
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function validatePassword(password) {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter";
  if (!/\d/.test(password)) return "Must contain at least one number";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return "Must contain at least one special character (!@#$%^&* etc.)";
  return null;
}

export function passwordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  const map = [
    { label: "", color: "" },
    { label: "Very Weak", color: "#EF4444" },
    { label: "Weak", color: "#F97316" },
    { label: "Fair", color: "#F59E0B" },
    { label: "Strong", color: "#10B981" },
    { label: "Very Strong", color: "#0EA5E9" },
  ];
  return { score, ...map[score] };
}

/**
 * Student ID input helper — enforces WOUR/ prefix and format
 */
export function formatStudentIdInput(raw) {
  // Always start with WOUR/
  const PREFIX = "WOUR/";
  if (!raw.startsWith(PREFIX)) raw = PREFIX;
  const rest = raw.slice(PREFIX.length);

  // Split on second slash
  const parts = rest.split("/");
  let digits1 = parts[0].replace(/\D/g, "").slice(0, 4);
  let digits2 = parts.length > 1 ? parts[1].replace(/\D/g, "").slice(0, 2) : "";

  if (digits2 || rest.includes("/")) {
    return PREFIX + digits1 + "/" + digits2;
  }
  return PREFIX + digits1;
}
