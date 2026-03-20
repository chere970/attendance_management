"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { apiFetch, getStoredToken, withApiAssetUrl } from "@/lib/api";

type Employee = {
  id: string;
  name?: string | null;
  employeeId?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  photo?: string | null;
  fingerprint?: string | null;
  status?: string | null;
};

function normalizeEmployees(list: Employee[]): Employee[] {
  return list.map((employee) => ({
    ...employee,
    photo: withApiAssetUrl(employee.photo || ""),
  }));
}

function getInitials(employee: Employee) {
  const source =
    employee.name?.trim() ||
    employee.username?.trim() ||
    employee.email?.trim() ||
    "?";

  return source.charAt(0).toUpperCase();
}

function StatusBadge({ status }: { status?: string | null }) {
  const value = (status || "CHECK_OUT").toUpperCase();

  return (
    <span
      className={
        value === "CHECK_IN"
          ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
          : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
      }
    >
      {value === "CHECK_IN" ? "Checked In" : "Checked Out"}
    </span>
  );
}

function EmployeeGrid({
  employees,
  deletingId,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  deletingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!employees.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        No employees found.
      </div>
    );
  }

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {employees.map((employee) => (
        <Card
          key={employee.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src={employee.photo || undefined}
                  alt={employee.name || employee.username || "Employee"}
                />
                <AvatarFallback>{getInitials(employee)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-900">
                  {employee.name || employee.username || "Unnamed employee"}
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {employee.username || employee.email || "-"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium">Employee ID:</span>{" "}
                {employee.employeeId || "-"}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {employee.email || "-"}
              </p>
              <p>
                <span className="font-medium">Department:</span>{" "}
                {employee.department || "-"}
              </p>
              <p>
                <span className="font-medium">Role:</span>{" "}
                {(employee.role || "employee").toString().toUpperCase()}
              </p>
              <div className="pt-1">
                <StatusBadge status={employee.status} />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => onEdit(employee.id)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>

              <Button
                size="sm"
                variant="destructive"
                className="flex items-center gap-2"
                onClick={() => onDelete(employee.id)}
                disabled={deletingId === employee.id}
              >
                {deletingId === employee.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export default function Page() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadEmployees() {
      try {
        setLoading(true);
        setError(null);

        const token = getStoredToken();
        if (!token) {
          router.push("/employee/login");
          return;
        }

        const data = await apiFetch<Employee[]>("/prisma", {
          method: "GET",
          token,
        });

        if (!mounted) return;
        setEmployees(normalizeEmployees(Array.isArray(data) ? data : []));
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load employees");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEmployees();

    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredEmployees = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return employees;

    return employees.filter((employee) => {
      const fields = [
        employee.name,
        employee.username,
        employee.email,
        employee.employeeId,
        employee.department,
        employee.role,
        employee.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(value);
    });
  }, [employees, query]);

  const handleEdit = (id: string) => {
    router.push(`/admin/dashboard/editEmployee/${encodeURIComponent(id)}`);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this employee? Their related attendance and request records will also be removed.",
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError(null);

      const token = getStoredToken();
      if (!token) {
        router.push("/employee/login");
        return;
      }

      await apiFetch<{ ok: boolean }>(`/prisma/${encodeURIComponent(id)}`, {
        method: "DELETE",
        token,
      });

      setEmployees((current) => current.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
            <p className="text-sm text-slate-600">
              View, search, edit, and manage employee records.
            </p>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, department, or ID"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filteredEmployees.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {employees.length}
            </span>{" "}
            employees
          </div>

          <Button
            onClick={() => router.push("/admin/dashboard/addNewEmployee")}
          >
            Add Employee
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-600 shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading employees...
          </div>
        )}

        {error && !loading && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && (
          <EmployeeGrid
            employees={filteredEmployees}
            deletingId={deletingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </main>
  );
}
