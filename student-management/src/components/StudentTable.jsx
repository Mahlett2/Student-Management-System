// src/components/StudentTable.jsx
import React from "react";

const StudentTable = () => {
  const students = [
    { id: 1, name: "John Doe", email: "john@mail.com", dept: "CS" },
    { id: 2, name: "Jane Smith", email: "jane@mail.com", dept: "IT" },
  ];

  return (
    <table className="w-full bg-white shadow rounded mt-4">
      <thead className="bg-gray-200">
        <tr>
          <th className="p-3">ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Department</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id} className="text-center border-t">
            <td className="p-2">{s.id}</td>
            <td>{s.name}</td>
            <td>{s.email}</td>
            <td>{s.dept}</td>
            <td>
              <button className="text-blue-500 mr-2">Edit</button>
              <button className="text-red-500">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StudentTable;
