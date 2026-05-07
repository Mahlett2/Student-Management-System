import "../styles/layout.css";

export default function Navbar() {
  return (
    <div className="navbar">
      <input placeholder="Search..." />

      <button
        onClick={() => {
          localStorage.removeItem("auth");
          window.location.href = "/login";
        }}
      >
        Logout
      </button>
    </div>
  );
}
