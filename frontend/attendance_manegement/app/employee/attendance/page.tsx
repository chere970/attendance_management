"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AttendanceStatus {
  attendance: any;
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
}

const AttendancePage = () => {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/employee/login");
        return;
      }

      const res = await fetch("http://localhost:5000/attendance/today", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch attendance status");
      }

      const data = await res.json();
      setStatus(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateBiometricScan = () => {
    return new Promise<void>((resolve) => {
      setIsScanning(true);
      setScanStatus("Initializing scanner...");

      setTimeout(() => {
        setScanStatus("Place your finger on the scanner...");
      }, 1000);

      setTimeout(() => {
        setScanStatus("Scanning fingerprint...");
      }, 2000);

      setTimeout(() => {
        setScanStatus("Verifying identity...");
      }, 3000);

      setTimeout(() => {
        setScanStatus("Authentication successful!");
        setIsScanning(false);
        resolve();
      }, 4000);
    });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulate biometric scanning
      await simulateBiometricScan();

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login first");
      }

      const res = await fetch("http://localhost:5000/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.error === "Already checked in") {
          setError(
            `You are already checked in at ${formatTime(data.checkInTime)}`
          );
          return;
        }
        throw new Error(data.error || "Failed to check in");
      }

      setSuccess(`Check-in successful at ${formatTime(data.checkInTime)}`);
      setStatus({
        attendance: data.attendance,
        isCheckedIn: true,
        checkInTime: data.checkInTime,
        checkOutTime: null,
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
      setScanStatus("");
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulate biometric scanning
      await simulateBiometricScan();

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login first");
      }

      const res = await fetch("http://localhost:5000/attendance/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check out");
      }

      setSuccess(`Check-out successful at ${formatTime(data.checkOutTime)}`);
      setStatus({
        attendance: data.attendance,
        isCheckedIn: false,
        checkInTime: data.attendance.checkIn,
        checkOutTime: data.checkOutTime,
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
      setScanStatus("");
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading attendance status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-2">
          {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Today's Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge
                className={
                  status?.isCheckedIn
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {status?.isCheckedIn ? "Checked In" : "Checked Out"}
              </Badge>
            </div>

            {status?.checkInTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Check-in Time:</span>
                <span className="text-sm text-gray-600">
                  {formatTime(status.checkInTime)}
                </span>
              </div>
            )}

            {status?.checkOutTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Check-out Time:</span>
                <span className="text-sm text-gray-600">
                  {formatTime(status.checkOutTime)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Biometric Scanner Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Fingerprint className="w-5 h-5" />
            <span>Biometric Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            {/* Scanner Animation */}
            <div className="relative">
              <div
                className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  isScanning
                    ? "border-blue-500 bg-blue-50 animate-pulse"
                    : status?.isCheckedIn
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                {isScanning ? (
                  <Fingerprint className="w-12 h-12 text-blue-600 animate-bounce" />
                ) : (
                  <Fingerprint className="w-12 h-12 text-gray-600" />
                )}
              </div>

              {/* Scanning rings animation */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 border-2 border-blue-300 rounded-full animate-ping"></div>
                </div>
              )}
            </div>

            {/* Scan Status */}
            {scanStatus && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">{scanStatus}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: scanStatus.includes("Initializing")
                        ? "25%"
                        : scanStatus.includes("Place your finger")
                        ? "50%"
                        : scanStatus.includes("Scanning")
                        ? "75%"
                        : "100%",
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 justify-center">
              <Button
                onClick={handleCheckIn}
                disabled={actionLoading || status?.isCheckedIn}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{actionLoading ? "Processing..." : "Check In"}</span>
              </Button>

              <Button
                onClick={handleCheckOut}
                disabled={actionLoading || !status?.isCheckedIn}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{actionLoading ? "Processing..." : "Check Out"}</span>
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-600">
              <p>
                {status?.isCheckedIn
                  ? "You are currently checked in. Click 'Check Out' to end your workday."
                  : "Click 'Check In' to start your workday with biometric verification."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {status?.checkInTime ? "✓" : "○"}
              </div>
              <div className="text-sm text-gray-600">Check-in</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {status?.checkOutTime ? "✓" : "○"}
              </div>
              <div className="text-sm text-gray-600">Check-out</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
