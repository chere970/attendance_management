"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  API_URL,
  apiFetch,
  getStoredToken,
  getStoredUser,
  isAdmin,
  withApiAssetUrl,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmployeeResponse = {
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

type EmployeeFormState = {
  name: string;
  employeeId: string;
  username: string;
  email: string;
  role: string;
  department: string;
  fingerprint: string;
  status: string;
  password: string;
};

const initialForm: EmployeeFormState = {
  name: "",
  employeeId: "",
  username: "",
  email: "",
  role: "employee",
  department: "",
  fingerprint: "",
  status: "CHECK_OUT",
  password: "",
};

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const employeeId = Array.isArray(rawId) ? (rawId[0] ?? "") : (rawId ?? "");

  const [form, setForm] = useState<EmployeeFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const token = useMemo(() => getStoredToken(), []);
  const currentUser = useMemo(() => getStoredUser(), []);
  const adminEditing = isAdmin(currentUser?.role);

  useEffect(() => {
    let active = true;

    async function loadEmployee() {
      if (!employeeId) {
        setPageError("Missing employee ID.");
        setLoading(false);
        return;
      }

      if (!token) {
        router.push("/employee/login");
        return;
      }

      try {
        const employee = await apiFetch<EmployeeResponse>(
          `/prisma/${encodeURIComponent(employeeId)}`,
          { token, method: "GET" },
        );

        if (!active) return;

        setForm({
          name: employee.name || "",
          employeeId: employee.employeeId || "",
          username: employee.username || "",
          email: employee.email || "",
          role: (employee.role || "employee").toString().toLowerCase(),
          department: employee.department || "",
          fingerprint: employee.fingerprint || "",
          status: employee.status || "CHECK_OUT",
          password: "",
        });
        setPhotoPreview(withApiAssetUrl(employee.photo || ""));
      } catch (error) {
        if (!active) return;
        setPageError(
          error instanceof Error ? error.message : "Failed to load employee.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEmployee();

    return () => {
      active = false;
    };
  }, [employeeId, router, token]);

  const updateField = (field: keyof EmployeeFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSubmitError(null);

    if (!file) {
      setSelectedPhoto(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSubmitError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Image size must be 5MB or less.");
      return;
    }

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.username.trim()) return "Username is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.department.trim()) return "Department is required.";

    if (adminEditing && !form.employeeId.trim()) {
      return "Employee ID is required.";
    }

    return null;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("username", form.username.trim());
      payload.append("email", form.email.trim().toLowerCase());
      payload.append("department", form.department.trim());

      if (adminEditing) {
        payload.append("employeeId", form.employeeId.trim());
        payload.append("role", form.role);
        payload.append("status", form.status);
        if (form.fingerprint.trim()) {
          payload.append("fingerprint", form.fingerprint.trim());
        }
      }

      if (form.password.trim()) {
        payload.append("password", form.password.trim());
      }

      if (selectedPhoto) {
        payload.append("photo", selectedPhoto);
      }

      await apiFetch(`/prisma/${encodeURIComponent(employeeId)}`, {
        method: "PATCH",
        body: payload,
        token,
      });

      setSuccess("Employee updated successfully.");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 900);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save employee.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!adminEditing) return;

    const confirmed = window.confirm(
      "Delete this employee? This will also remove related attendance and request records.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setSubmitError(null);
    setSuccess(null);

    try {
      await apiFetch(`/prisma/${encodeURIComponent(employeeId)}`, {
        method: "DELETE",
        token,
      });
      router.push("/admin/dashboard");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to delete employee.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-10 text-center text-slate-600">
              Loading employee...
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-red-600">{pageError}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => router.push("/admin/dashboard")}
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Employee</h1>
          <p className="mt-1 text-sm text-slate-600">
            Update employee information securely, including optional photo
            replacement and password reset.
          </p>
        </div>

        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-2xl border bg-slate-100">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={form.name || form.username || "Employee photo"}
                    className="h-72 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center text-slate-400">
                    No photo selected
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Replace Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handlePhotoChange}
                />
                <p className="text-xs text-slate-500">
                  Accepted: JPG, PNG, WEBP, GIF. Max size: 5MB.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {submitError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Employee full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    placeholder="Department"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                {adminEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={form.employeeId}
                      onChange={(e) =>
                        updateField("employeeId", e.target.value)
                      }
                      placeholder="EMP-001"
                      required
                    />
                  </div>
                )}

                {adminEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) => updateField("role", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="employee">EMPLOYEE</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </div>
                )}

                {adminEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="CHECK_OUT">CHECK_OUT</option>
                      <option value="CHECK_IN">CHECK_IN</option>
                    </select>
                  </div>
                )}

                {adminEditing && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fingerprint">Fingerprint</Label>
                    <Input
                      id="fingerprint"
                      value={form.fingerprint}
                      onChange={(e) =>
                        updateField("fingerprint", e.target.value)
                      }
                      placeholder="Optional fingerprint reference"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button type="submit" disabled={saving || deleting}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || deleting}
                  onClick={() => router.push("/admin/dashboard")}
                >
                  Cancel
                </Button>

                {adminEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving || deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? "Deleting..." : "Delete Employee"}
                  </Button>
                )}
              </div>

              <p className="text-xs text-slate-500">API target: {API_URL}</p>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}
