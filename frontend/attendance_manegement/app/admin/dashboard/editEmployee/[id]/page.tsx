"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type Employee = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  department?: string;
  photo?: string;
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px 14px",
  marginTop: 6,
  marginBottom: 16,
  borderRadius: 8,
  border: "1.8px solid #ccc",
  fontSize: 16,
  transition: "border-color 0.3s",
  outline: "none" as "none",
};

const inputFocusStyle = {
  borderColor: "#2563eb",
  boxShadow: "0 0 6px rgba(37, 99, 235, 0.4)",
};

const buttonBase = {
  padding: "10px 18px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
  border: "none",
  transition: "background-color 0.3s",
  flex: 1,
  textAlign: "center" as "center",
  userSelect: "none" as "none",
};

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const id: string = Array.isArray(rawId) ? rawId[0] ?? "" : rawId ?? "";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing employee id");
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const url = `${API_URL}/prisma/${encodeURIComponent(id)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok)
          throw new Error(`Failed to fetch employee (${res.status})`);
        const data = await res.json();
        if (mounted) setEmployee(data);
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (field: keyof Employee, value: string) =>
    setEmployee((p) => (p ? { ...p, [field]: value } : p));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !employee) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/prisma/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || `Save failed (${res.status})`);
      }
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // const handleDelete = async () => {
  //   if (!id || !confirm("Delete this employee?")) return;
  //   setSaving(true);
  //   setError(null);
  //   try {
  //     const res = await fetch(
  //       `http://localhost:5000/prisma/${encodeURIComponent(id)}`,
  //       { method: "DELETE" }
  //     );
  //     if (!res.ok) {
  //       const b = await res.json().catch(() => ({}));
  //       throw new Error(b?.error || `Delete failed (${res.status})`);
  //     }
  //     router.push("/admin/dashboard");
  //   } catch (err: any) {
  //     setError(err.message || "Delete failed");
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  if (loading)
    return (
      <div
        style={{
          padding: 40,
          fontSize: 18,
          color: "#999",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Loading…
      </div>
    );
  if (error)
    return (
      <div
        style={{
          padding: 40,
          color: "#dc2626",
          fontWeight: "bold",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {error}
      </div>
    );
  if (!employee)
    return (
      <div
        style={{
          padding: 40,
          fontSize: 18,
          color: "#555",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Employee not found
      </div>
    );

  return (
    <div
      style={{
        padding: 30,
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <form
        onSubmit={handleSave}
        style={{
          background: "#fff",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: 700,
        }}
      >
        <h1
          style={{
            marginBottom: 24,
            fontWeight: 700,
            fontSize: 28,
            color: "#111827",
            textAlign: "center",
          }}
        >
          Edit Employee
        </h1>

        {[
          { label: "Name", field: "name" },
          { label: "Username", field: "username" },
          { label: "Email", field: "email", type: "email" },
          { label: "Role", field: "role" },
          { label: "Department", field: "department" },
          { label: "Photo URL", field: "photo" },
        ].map(({ label, field, type }) => (
          <label
            key={field}
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: 15,
              color: "#374151",
            }}
          >
            {label}
            <input
              type={type ?? "text"}
              value={employee[field as keyof Employee] ?? ""}
              onChange={(e) =>
                handleChange(field as keyof Employee, e.target.value)
              }
              onFocus={() => setFocusField(field)}
              onBlur={() => setFocusField(null)}
              style={{
                ...inputStyle,
                ...(focusField === field ? inputFocusStyle : {}),
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        ))}

        <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...buttonBase,
              backgroundColor: saving ? "#93c5fd" : "#2563eb",
              color: "#fff",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {/* <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            style={{
              ...buttonBase,
              backgroundColor: saving ? "#fca5a5" : "#ef4444",
              color: "#fff",
            }}
          >
            {saving ? "Processing…" : "Delete"}
          </button> */}

          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            style={{
              ...buttonBase,
              backgroundColor: "#e5e7eb",
              color: "#374151",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 18,
              padding: 10,
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              borderRadius: 8,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
