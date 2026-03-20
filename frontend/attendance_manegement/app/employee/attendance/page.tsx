"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Fingerprint,
  CheckCircle,
  Clock,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  CalendarDays,
  Timer,
} from "lucide-react";
import { apiFetch, decodeJwtPayload, getStoredToken } from "@/lib/api";

type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
};

type AttendanceStatus = {
  attendance: AttendanceRecord | null;
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
};

type JwtPayload = {
  userId?: string;
  email?: string;
  role?: string;
};

const scanMessages = [
  "Initializing scanner...",
  "Place your finger on the scanner...",
  "Scanning fingerprint...",
  "Verifying identity...",
  "Authentication successful!",
];

function formatTime(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getWorkedMinutes(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return null;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.floor((end - start) / 60000);
}

function formatDuration(totalMinutes?: number | null) {
  if (totalMinutes == null) return "--";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function AttendancePage() {
  const router = useRouter();
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "checkin" | "checkout" | null
  >(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const token = useMemo(() => getStoredToken(), []);

  useEffect(() => {
    if (!token) {
      router.push("/employee/login");
      return;
    }

    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload?.userId) {
      router.push("/employee/login");
      return;
    }

    void fetchTodayStatus(token);
  }, [router, token]);

  const fetchTodayStatus = async (authToken: string) => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch<AttendanceStatus>("/attendance/today", {
        method: "GET",
        token: authToken,
        cache: "no-store",
      });

      setStatus(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch attendance status",
      );
    } finally {
      setLoading(false);
    }
  };

  const simulateBiometricScan = async () => {
    setIsScanning(true);
    for (let i = 0; i < scanMessages.length; i += 1) {
      setScanStatus(scanMessages[i]);
      await new Promise((resolve) =>
        setTimeout(resolve, i === scanMessages.length - 1 ? 500 : 700),
      );
    }
    setIsScanning(false);
  };

  const handleCheckIn = async () => {
    if (!token) {
      router.push("/employee/login");
      return;
    }

    setActionLoading("checkin");
    setError("");
    setSuccess("");

    try {
      await simulateBiometricScan();

      const data = await apiFetch<{
        attendance: AttendanceRecord;
        checkInTime: string;
        message: string;
      }>("/attendance/checkin", {
        method: "POST",
        token,
      });

      setSuccess(`Check-in successful at ${formatTime(data.checkInTime)}`);
      setStatus({
        attendance: data.attendance,
        isCheckedIn: true,
        checkInTime: data.checkInTime,
        checkOutTime: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in");
    } finally {
      setActionLoading(null);
      setScanStatus("");
      setIsScanning(false);
    }
  };

  const handleCheckOut = async () => {
    if (!token) {
      router.push("/employee/login");
      return;
    }

    setActionLoading("checkout");
    setError("");
    setSuccess("");

    try {
      await simulateBiometricScan();

      const data = await apiFetch<{
        attendance: AttendanceRecord;
        checkOutTime: string;
        message: string;
      }>("/attendance/checkout", {
        method: "POST",
        token,
      });

      setSuccess(`Check-out successful at ${formatTime(data.checkOutTime)}`);
      setStatus({
        attendance: data.attendance,
        isCheckedIn: false,
        checkInTime: data.attendance.checkIn,
        checkOutTime: data.checkOutTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check out");
    } finally {
      setActionLoading(null);
      setScanStatus("");
      setIsScanning(false);
    }
  };

  const workedMinutes = getWorkedMinutes(
    status?.checkInTime,
    status?.checkOutTime,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading attendance status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
          <p className="mt-2 text-slate-600">{formatDate()}</p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today&apos;s Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Current Status
              </span>
              <Badge
                className={
                  status?.isCheckedIn
                    ? "bg-green-100 text-green-800"
                    : "bg-slate-100 text-slate-700"
                }
              >
                {status?.isCheckedIn ? "Checked In" : "Checked Out"}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 text-sm font-medium text-slate-600">
                  Check-in Time
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatTime(status?.checkInTime)}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 text-sm font-medium text-slate-600">
                  Check-out Time
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatTime(status?.checkOutTime)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Biometric Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-center">
              <div className="relative mx-auto w-fit">
                <div
                  className={`flex h-32 w-32 items-center justify-center rounded-full border-4 transition-all duration-300 ${
                    isScanning
                      ? "border-blue-500 bg-blue-50"
                      : status?.isCheckedIn
                        ? "border-green-500 bg-green-50"
                        : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <Fingerprint
                    className={`h-12 w-12 ${
                      isScanning
                        ? "animate-pulse text-blue-600"
                        : status?.isCheckedIn
                          ? "text-green-600"
                          : "text-slate-500"
                    }`}
                  />
                </div>

                {isScanning && (
                  <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping" />
                )}
              </div>

              {scanStatus && (
                <div className="mx-auto max-w-md space-y-2">
                  <p className="text-sm text-slate-600">{scanStatus}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: scanStatus.includes("Initializing")
                          ? "20%"
                          : scanStatus.includes("Place your finger")
                            ? "40%"
                            : scanStatus.includes("Scanning")
                              ? "65%"
                              : scanStatus.includes("Verifying")
                                ? "85%"
                                : "100%",
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  onClick={handleCheckIn}
                  disabled={!!actionLoading || status?.isCheckedIn}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {actionLoading === "checkin" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  {actionLoading === "checkin" ? "Processing..." : "Check In"}
                </Button>

                <Button
                  onClick={handleCheckOut}
                  disabled={!!actionLoading || !status?.isCheckedIn}
                  className="bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  {actionLoading === "checkout" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {actionLoading === "checkout" ? "Processing..." : "Check Out"}
                </Button>
              </div>

              <p className="text-sm text-slate-600">
                {status?.isCheckedIn
                  ? "You are currently checked in. Use Check Out when you finish your workday."
                  : "Use Check In to start your workday with biometric verification."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {status?.checkInTime ? "Done" : "Pending"}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {status?.checkInTime
                  ? `Recorded at ${formatTime(status.checkInTime)}`
                  : "No check-in recorded yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                Check-out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {status?.checkOutTime ? "Done" : "Pending"}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {status?.checkOutTime
                  ? `Recorded at ${formatTime(status.checkOutTime)}`
                  : "No check-out recorded yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4 text-purple-600" />
                Worked Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatDuration(workedMinutes)}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {workedMinutes == null
                  ? "Available after check-out"
                  : "Calculated from today's check-in and check-out"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
