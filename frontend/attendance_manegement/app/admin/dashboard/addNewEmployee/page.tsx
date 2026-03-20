"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL, getStoredToken, isAdmin } from "@/lib/api";

type EmployeeFormState = {
  name: string;
  employeeId: string;
  username: string;
  email: string;
  password: string;
  role: "employee" | "admin";
  department: string;
  fingerprint: string;
  status: "CHECK_OUT" | "CHECK_IN";
};

const initialForm: EmployeeFormState = {
  name: "",
  employeeId: "",
  username: "",
  email: "",
  password: "",
  role: "employee",
  department: "",
  fingerprint: "",
  status: "CHECK_OUT",
};

export default function AddNewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState<EmployeeFormState>(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const previewUrl = useMemo(() => {
    if (!photo) return "";
    return URL.createObjectURL(photo);
  }, [photo]);

  const handleChange = (field: keyof EmployeeFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validatePhoto = (file: File | null) => {
    if (!file) {
      setPhotoError("");
      return true;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowed.includes(file.type)) {
      setPhotoError("Only JPG, PNG, WEBP, and GIF images are allowed.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be 5MB or smaller.");
      return false;
    }

    setPhotoError("");
    return true;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!validatePhoto(file)) {
      e.target.value = "";
      setPhoto(null);
      return;
    }
    setPhoto(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const token = getStoredToken();
      const rawUser =
        typeof window !== "undefined"
          ? window.localStorage.getItem("user")
          : null;
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;

      if (!token) {
        throw new Error("Please login as an admin first.");
      }

      if (!isAdmin(parsedUser?.role)) {
        throw new Error("Only admins can add employees.");
      }

      if (
        !form.employeeId.trim() ||
        !form.username.trim() ||
        !form.email.trim() ||
        !form.password.trim() ||
        !form.department.trim()
      ) {
        throw new Error(
          "Employee ID, username, email, password, and department are required.",
        );
      }

      if (!validatePhoto(photo)) {
        throw new Error("Please fix the selected photo before submitting.");
      }

      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("employeeId", form.employeeId.trim());
      payload.append("username", form.username.trim());
      payload.append("email", form.email.trim().toLowerCase());
      payload.append("password", form.password);
      payload.append("role", form.role);
      payload.append("department", form.department.trim());
      payload.append(
        "fingerprint",
        form.fingerprint.trim() || "default_fingerprint",
      );
      payload.append("status", form.status);

      if (photo) {
        payload.append("photo", photo);
      }

      const res = await fetch(`${API_URL}/prisma`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Create failed (${res.status})`);
      }

      setSuccess("Employee created successfully.");
      setForm(initialForm);
      setPhoto(null);

      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create employee",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Add New Employee
            </CardTitle>
            <CardDescription>
              Create an employee account with optional profile photo upload.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeId">
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employeeId"
                    value={form.employeeId}
                    onChange={(e) => handleChange("employeeId", e.target.value)}
                    placeholder="EMP-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    placeholder="johndoe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Enter a secure password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="department"
                    value={form.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    placeholder="Human Resources"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) =>
                      handleChange(
                        "role",
                        e.target.value as EmployeeFormState["role"],
                      )
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) =>
                      handleChange(
                        "status",
                        e.target.value as EmployeeFormState["status"],
                      )
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="CHECK_OUT">Checked Out</option>
                    <option value="CHECK_IN">Checked In</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fingerprint">Fingerprint</Label>
                  <Input
                    id="fingerprint"
                    value={form.fingerprint}
                    onChange={(e) =>
                      handleChange("fingerprint", e.target.value)
                    }
                    placeholder="Optional fingerprint identifier"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="photo">Profile Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-xs text-slate-500">
                    Optional. Max 5MB. JPG, PNG, WEBP, or GIF.
                  </p>
                  {photoError ? (
                    <p className="text-sm text-red-600">{photoError}</p>
                  ) : null}
                </div>
              </div>

              {previewUrl ? (
                <div className="space-y-2">
                  <Label>Photo Preview</Label>
                  <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="h-24 w-24 rounded-full object-cover border"
                    />
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-800">
                        {photo?.name}
                      </p>
                      <p>
                        {photo
                          ? `${(photo.size / 1024 / 1024).toFixed(2)} MB`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={creating}
                  className="sm:min-w-36"
                >
                  {creating ? "Creating..." : "Create Employee"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/dashboard")}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
