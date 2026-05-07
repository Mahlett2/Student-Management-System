export default function ResultsTable({
  results,
  onEdit,
  onDelete,
  search,
  onSearchChange,
  filterPeriod,
  onFilterChange,
  periods,
}) {
  return (
    <div>
      {/* Search & Filter Controls */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Search by name or subject..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: "180px" }}
        />
        <select
          value={filterPeriod}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="">All Periods</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Table or Empty State */}
      {results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <table className="student-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Subject</th>
              <th>Period</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td>{r.subject}</td>
                <td>{r.period}</td>
                <td>{r.grade}</td>
                <td>
                  <button onClick={() => onEdit(r)} style={{ marginRight: "0.4rem" }}>
                    ✏️ Edit
                  </button>
                  <button className="delete-btn" onClick={() => onDelete(r.id)}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
