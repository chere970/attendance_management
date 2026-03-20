"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  Timer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCircle2,
  RefreshCw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

type StoredUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  employeeId?: string | null;
  role?: string | null;
  department?: string | null;
  photo?: string | null;
  status?: string | null;
};

type AttendanceStatus = {
  attendance: {
    id: string;
    employeeId: string;
    date: string;
    checkIn: string;
    checkOut: string | null;
  } | null;
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
};

type AttendanceHistoryItem = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workedMinutes?: number | null;
};

type RequestItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  comments?: string | null;
};

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function getApiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function withApiAssetUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return getApiUrl(path);
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(minutes?: number | null) {
  if (minutes == null) return "--";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

function getWorkedMinutes(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return null;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.floor((end - start) / 60000);
}

function requestTypeLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusBadgeClass(status?: string | null) {
  switch ((status || "").toUpperCase()) {
    case "APPROVED":
    case "CHECK_IN":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (silent = false) => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.push("/employee/login");
      return;
    }

    try {
      setError("");
      setUser(storedUser);

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [todayStatus, attendanceHistory, requestHistory] =
        await Promise.all([
          apiFetch<AttendanceStatus>("/attendance/today"),
          apiFetch<AttendanceHistoryItem[]>("/attendance/history?limit=7"),
          apiFetch<RequestItem[]>("/requests/my-requests?limit=5"),
        ]);

      setAttendance(todayStatus);
      setHistory(Array.isArray(attendanceHistory) ? attendanceHistory : []);
      setRequests(Array.isArray(requestHistory) ? requestHistory : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const completedHistory = history.filter((item) => item.checkOut);
    const totalWorkedMinutes = completedHistory.reduce(
      (sum, item) =>
        sum +
        (item.workedMinutes ??
          getWorkedMinutes(item.checkIn, item.checkOut) ??
          0),
      0,
    );

    const pendingRequests = requests.filter(
      (item) => item.status === "PENDING",
    ).length;
    const approvedRequests = requests.filter(
      (item) => item.status === "APPROVED",
    ).length;

    return {
      totalWorkedMinutes,
      pendingRequests,
      approvedRequests,
      recentDays: history.length,
    };
  }, [history, requests]);

  const todayWorkedMinutes = useMemo(
    () =>
      getWorkedMinutes(
        attendance?.checkInTime ?? null,
        attendance?.checkOutTime ?? null,
      ),
    [attendance],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center text-slate-600">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {formatDateLong()}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-2 text-slate-600">
              Here&apos;s your attendance, request, and account overview.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Today&apos;s Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={statusBadgeClass(
                  attendance?.isCheckedIn ? "CHECK_IN" : "CHECK_OUT",
                )}
              >
                {attendance?.isCheckedIn ? "Checked In" : "Checked Out"}
              </Badge>
              <p className="mt-3 text-sm text-slate-500">
                Check-in: {formatTime(attendance?.checkInTime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Today&apos;s Worked Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatDuration(todayWorkedMinutes)}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Available after check-out
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.pendingRequests}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Waiting for admin review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Recent Worked Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(stats.totalWorkedMinutes)}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Across last {stats.recentDays} attendance records
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today&apos;s Attendance
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/employee/attendance")}
              >
                Open Attendance
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <LogIn className="h-4 w-4 text-green-600" />
                    Check In
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {formatTime(attendance?.checkInTime)}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <LogOut className="h-4 w-4 text-red-600" />
                    Check Out
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {formatTime(attendance?.checkOutTime)}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Timer className="h-4 w-4 text-blue-600" />
                    Worked Time
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {formatDuration(todayWorkedMinutes)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {attendance?.isCheckedIn
                  ? "You are currently checked in. Remember to check out when your workday ends."
                  : attendance?.checkInTime
                    ? "You have completed today's attendance session."
                    : "You have not checked in yet today."}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle2 className="h-5 w-5" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border bg-slate-100">
                  {user?.photo ? (
                    <img
                      src={withApiAssetUrl(user.photo)}
                      alt={user.name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <UserCircle2 className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {user?.name || "Employee"}
                  </p>
                  <p className="text-sm text-slate-500">
                    @{user?.username || "user"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{user?.department || "--"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Employee ID: {user?.employeeId || "--"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Status: {user?.status || "CHECK_OUT"}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/employee/profile")}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Recent Attendance History
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/employee/history")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
                  No attendance history yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 4).map((item) => {
                    const worked =
                      item.workedMinutes ??
                      getWorkedMinutes(item.checkIn, item.checkOut);

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {formatDate(item.date)}
                            </p>
                            <p className="text-sm text-slate-500">
                              In: {formatTime(item.checkIn)} • Out:{" "}
                              {formatTime(item.checkOut)}
                            </p>
                          </div>

                          <Badge
                            className={
                              item.checkOut
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }
                          >
                            {item.checkOut ? formatDuration(worked) : "Active"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Requests
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/employee/request")}
              >
                Manage Requests
              </Button>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
                  No requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.slice(0, 4).map((request) => (
                    <div
                      key={request.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {request.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {requestTypeLabel(request.type)} •{" "}
                            {formatDate(request.startDate)} -{" "}
                            {formatDate(request.endDate)}
                          </p>
                        </div>

                        <Badge className={statusBadgeClass(request.status)}>
                          {request.status}
                        </Badge>
                      </div>

                      {request.comments ? (
                        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          <span className="font-medium">Admin comment:</span>{" "}
                          {request.comments}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition hover:shadow-md">
            <CardContent
              className="p-5"
              onClick={() => router.push("/employee/attendance")}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Clock className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Attendance</h3>
              <p className="mt-1 text-sm text-slate-500">
                Check in, check out, and review today&apos;s attendance.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition hover:shadow-md">
            <CardContent
              className="p-5"
              onClick={() => router.push("/employee/request")}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Requests</h3>
              <p className="mt-1 text-sm text-slate-500">
                Submit leave requests and track their approval status.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition hover:shadow-md">
            <CardContent
              className="p-5"
              onClick={() => router.push("/employee/profile")}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <UserCircle2 className="h-5 w-5 text-purple-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Profile</h3>
              <p className="mt-1 text-sm text-slate-500">
                Review your account information and update your photo.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Quick Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Make sure you check out before the end of your workday.
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Review pending requests regularly for status updates.
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Keep your profile photo and personal details up to date.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
