"use client";

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { format, parseISO } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Calendar, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

interface SummaryData {
  totalEmployees: number;
  onDuty: number;
  todaysCheckIns: number;
  presentToday: number;
  absentToday: number;
  completedToday: number;
  attendanceRate: number;
  checkInsPerDay: { date: string; count: number }[];
}

const AttendanceSummaryPage = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const summaryData = await apiFetch<SummaryData>("/attendance/summary");
      setData(summaryData);
    } catch (err: any) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      labels: data.checkInsPerDay.map((item) =>
        format(parseISO(item.date), "MMM d"),
      ),
      datasets: [
        {
          label: "Check-ins",
          data: data.checkInsPerDay.map((item) => item.count),
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.14)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [data]);

  const weeklyTotal =
    data?.checkInsPerDay.reduce((sum, day) => sum + day.count, 0) ?? 0;
  const weeklyAverage =
    data && data.checkInsPerDay.length
      ? Math.round(weeklyTotal / data.checkInsPerDay.length)
      : 0;
  const peakDay =
    data && data.checkInsPerDay.length
      ? Math.max(...data.checkInsPerDay.map((day) => day.count))
      : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-lg text-gray-600">
            Loading attendance summary...
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-lg text-red-600">
              Error loading summary
            </div>
            <div className="text-gray-600">{error || "No data available"}</div>
            <button
              onClick={fetchSummary}
              className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Summary</h1>
        <p className="mt-2 text-gray-600">
          Overview of today&apos;s attendance and the last 7 days of check-ins
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.onDuty}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently checked in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.presentToday}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees with attendance today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.absentToday}
            </div>
            <p className="text-xs text-muted-foreground">
              No attendance recorded today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {data.attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on employees present today
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.todaysCheckIns}</div>
            <p className="mt-1 text-sm text-gray-500">
              Total check-in records created today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Completed Attendance Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.completedToday}</div>
            <p className="mt-1 text-sm text-gray-500">
              Employees who checked out today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.onDuty}</div>
            <p className="mt-1 text-sm text-gray-500">
              Employees still checked in
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Last 7 Days - Daily Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData ? (
            <div className="h-72">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: "Date",
                      },
                    },
                    y: {
                      display: true,
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Check-ins",
                      },
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                  interaction: {
                    mode: "nearest",
                    axis: "x",
                    intersect: false,
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-gray-500">
              No chart data available
            </div>
          )}

          <div className="mt-6 border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
              <div>
                <div className="text-lg font-semibold">{weeklyTotal}</div>
                <div className="text-xs text-gray-600">Total (7 days)</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{weeklyAverage}</div>
                <div className="text-xs text-gray-600">Daily Average</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {peakDay}
                </div>
                <div className="text-xs text-gray-600">Peak Day</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {data.attendanceRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Today&apos;s Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceSummaryPage;
