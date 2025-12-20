"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Calendar, TrendingUp } from "lucide-react";

interface SummaryData {
  totalEmployees: number;
  onDuty: number;
  todaysCheckIns: number;
  checkInsPerDay: { date: string; count: number }[];
}

const AttendanceSummaryPage = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const res = await fetch(`${API_URL}/prisma/summarys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch summary data");
      }

      const summaryData = await res.json();
      setData(summaryData);
    } catch (err: any) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Create chart data only when data is available
  const chartData = data
    ? {
        labels: data.checkInsPerDay.map((d) =>
          format(parseISO(d.date), "MMM d")
        ),
        datasets: [
          {
            label: "Check-ins",
            data: data.checkInsPerDay.map((d) => d.count),
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.12)",
            tension: 0.25,
            fill: true,
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading attendance summary...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-2">
              Error loading summary
            </div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Summary</h1>
        <p className="text-gray-600 mt-2">
          Overview of employee attendance and statistics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              Registered in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Currently On Duty
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.onDuty}
            </div>
            <p className="text-xs text-muted-foreground">Checked in today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Check-ins
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todaysCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              Total check-ins today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Last 7 Days - Daily Check-ins</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData ? (
            <div className="h-64">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
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
                      title: {
                        display: true,
                        text: "Check-ins",
                      },
                      beginAtZero: true,
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
            <div className="h-64 flex items-center justify-center text-gray-500">
              No chart data available
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">
                  {data.checkInsPerDay.reduce((sum, day) => sum + day.count, 0)}
                </div>
                <div className="text-xs text-gray-600">Total (7 days)</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {Math.round(
                    data.checkInsPerDay.reduce(
                      (sum, day) => sum + day.count,
                      0
                    ) / 7
                  )}
                </div>
                <div className="text-xs text-gray-600">Daily Average</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {Math.max(...data.checkInsPerDay.map((d) => d.count))}
                </div>
                <div className="text-xs text-gray-600">Peak Day</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {((data.onDuty / data.totalEmployees) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Attendance Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceSummaryPage;
