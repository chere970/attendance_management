"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type EmployeeForm = {
  name?: string;
  employeeId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  department: string;
  photo: string;
  fingerprint: string;
  status?: string;
};

export default function AddNewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState<EmployeeForm>({
    name: "",
    employeeId: "",
    username: "",
    email: "",
    password: "",
    role: "emp",
    department: "",
    photo: "",
    fingerprint: "",
    status: " ",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (
        !form.username ||
        !form.employeeId ||
        !form.email ||
        !form.password ||
        !form.role ||
        !form.department ||
        !form.photo ||
        !form.fingerprint
      ) {
        throw new Error("Please fill required fields");
      }

      // const res = await fetch("http://localhost:5000/prisma", {
      const res = await fetch(`${API_URL}/prisma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Create failed (${res.status})`);
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 font-sans py-10">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-2xl">
        <h1 className="text-2xl font-extrabold text-gray-800 mb-6 text-center drop-shadow">
          Add New Employee
        </h1>
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Name</label>
            <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              placeholder="employee ID"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
            />
          </div>
          {/* <div>
            <label className="block font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Role"
            />
          </div> */}

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            {/* <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Role"
            /> */}
            <select
              id="role"
              value={form.role}
              // onChange={handleInputChange}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="employee">EMPLOYEE</option>
              <option value="admin">ADMIN</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="Department"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Photo URL <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.photo}
              onChange={(e) => setForm({ ...form, photo: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Fingerprint <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 px-4 py-3 transition-all shadow-sm outline-none"
              value={form.fingerprint}
              onChange={(e) =>
                setForm({ ...form, fingerprint: e.target.value })
              }
              placeholder="Fingerprint Data"
            />
          </div>
          <div className="flex gap-4 pt-3">
            <button
              type="submit"
              disabled={creating}
              className="bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600 transition-all text-white font-semibold py-2 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-all shadow focus:outline-none"
            >
              Cancel
            </button>
          </div>
          {error && (
            <div className="text-red-600 mt-6 text-center">{error}</div>
          )}
        </form>
      </div>
    </div>
  );
}
