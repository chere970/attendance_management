"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  Timer,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workedMinutes?: number | null;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  });

const formatTime = (value?: string | null) => {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWorkedDuration = (minutes?: number | null) => {
  if (minutes === null || minutes === undefined) return "--";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async (silent = false) => {
    try {
      setError("");
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await apiFetch<AttendanceRecord[]>(
        "/attendance/history?limit=30",
        {
          cache: "no-store",
        },
      );

      setRecords(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load attendance history",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const summary = useMemo(() => {
    const completed = records.filter((record) => record.checkOut);
    const totalWorkedMinutes = completed.reduce(
      (sum, record) => sum + (record.workedMinutes || 0),
      0,
    );

    return {
      totalRecords: records.length,
      completedDays: completed.length,
      activeDays: records.filter((record) => !record.checkOut).length,
      totalWorkedMinutes,
    };
  }, [records]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center text-slate-600">
          Loading attendance history...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Attendance History
          </h1>
          <p className="mt-2 text-slate-600">
            Review your recent check-ins, check-outs, and worked hours.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadHistory(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {summary.totalRecords}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Completed Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.completedDays}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {summary.activeDays}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Worked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatWorkedDuration(summary.totalWorkedMinutes)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Recent Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
              No attendance history found yet.
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const checkedOut = Boolean(record.checkOut);

                return (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {formatDate(record.date)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Attendance record
                        </p>
                      </div>

                      <Badge
                        className={
                          checkedOut
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {checkedOut ? "Completed" : "Active"}
                      </Badge>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <LogIn className="h-4 w-4 text-green-600" />
                          Check In
                        </div>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatTime(record.checkIn)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <LogOut className="h-4 w-4 text-red-600" />
                          Check Out
                        </div>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatTime(record.checkOut)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Timer className="h-4 w-4 text-blue-600" />
                          Worked Time
                        </div>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatWorkedDuration(record.workedMinutes)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      Created from check-in time on {formatDate(record.checkIn)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
