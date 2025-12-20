"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Pencil, Trash2, UserPlus } from "lucide-react";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
// Types

type Employee = {
  id: string;
  name?: string;
  employeeId?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  department?: string;
  photo?: string;
  fingerprint?: string;
  status?: string;
};

// Component to render employees

function PageComponent({
  employees,
  onEdit,
  onDelete,
  deletingId,
}: {
  employees: Employee[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {employees.length ? (
        employees.map((e) => (
          <Card
            key={e.id}
            className="rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition-all bg-white"
          >
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-14 h-14">
                  <AvatarImage
                    src={e.photo || "/placeholder-avatar.png"}
                    alt={e.name || e.username}
                  />
                  <AvatarFallback>
                    {e.name?.[0] || e.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {e.name || e.username}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {e.username} • {e.role || "No role"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm text-slate-700">
                <p>
                  <span className="font-medium">Email:</span> {e.email || "-"}
                </p>
                <p>
                  <span className="font-medium">Department:</span>{" "}
                  {e.department || "-"}
                </p>
                <p>
                  <span className="font-bold">Status:</span>{" "}
                  <span
                    className={
                      e.status === "CHECK_IN"
                        ? "text-green-600 font-medium"
                        : e.status === "CHECK_OUT"
                        ? "text-red-600 font-medium"
                        : "text-slate-500"
                    }
                  >
                    {e.status ?? "CHECK_OUT"}
                  </span>
                </p>
                <p className="text-sm font-medium  text-slate-700">
                  Employee ID: {e.employeeId}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => onEdit(e.id)}
                >
                  <Pencil className="w-4 h-4" /> Edit
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => onDelete(e.id)}
                  disabled={deletingId === e.id}
                >
                  {deletingId === e.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Delete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-slate-500 text-center py-10 col-span-full">
          No employees found.
        </div>
      )}
    </section>
  );
}

// Main Page

export default function Page() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchEmployees() {
      try {
        // const res = await fetch("http://localhost:5000/prisma", {
        const res = await fetch(`${API_URL}/prisma`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load employees");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.employees ?? [];
        // Prepend backend URL to photo paths for proper image display
        const updatedList = list.map((emp: Employee) => ({
          ...emp,
          photo:
            emp.photo && emp.photo.startsWith("/uploads/")
              ? `http://localhost:5000${emp.photo}`
              : emp.photo,
        }));
        if (mounted) setEmployees(updatedList);
      } catch (err: any) {
        if (mounted) setError(err.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchEmployees();
    return () => {
      mounted = false;
    };
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/admin/dashboard/editEmployee/${encodeURIComponent(id)}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee? This action cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/prisma/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || `Delete failed (${res.status})`);
      }
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="p-6 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
        {/* <Button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => router.push("/admin/dashboard/addNewEmployee")}
        >
          <UserPlus className="w-4 h-4" /> Add Employee
        </Button> */}
      </div>

      {loading && <div className="text-slate-500">Loading employees…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <PageComponent
          employees={employees}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </main>
  );
}
