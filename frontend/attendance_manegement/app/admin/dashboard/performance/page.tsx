"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { parseISO } from "date-fns/parseISO";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
}

interface Employee {
  id: string;
  name: string | null;
  username: string;
  email: string;
  department: string;
  status?: string | null;
}

interface WorkingHoursData {
  employee: Employee;
  totalHours: number;
  totalMinutes: number;
  attendanceRecords: (AttendanceRecord & {
    workingHours: number;
    workingMinutes: number;
    totalMinutes: number;
  })[];
  monthlyBreakdown: {
    month: string;
    year: number;
    hours: number;
    minutes: number;
    daysWorked: number;
  }[];
}

const WorkingHoursPage = () => {
  const [data, setData] = useState<WorkingHoursData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchWorkingHours = async (showRefreshing = false) => {
    try {
      setError(null);
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [employees, attendanceRecords] = await Promise.all([
        apiFetch<Employee[]>("/prisma", {
          method: "GET",
          cache: "no-store",
        }),
        apiFetch<AttendanceRecord[]>("/prisma/attendance/all", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const processedData = processWorkingHoursData(
        Array.isArray(employees) ? employees : [],
        Array.isArray(attendanceRecords) ? attendanceRecords : [],
      );

      setData(processedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load working hours",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchWorkingHours();
  }, []);

  const processWorkingHoursData = (
    employees: Employee[],
    attendanceRecords: AttendanceRecord[],
  ): WorkingHoursData[] => {
    return employees.map((employee) => {
      const employeeAttendance = attendanceRecords.filter(
        (record) => record.employeeId === employee.id && !!record.checkOut,
      );

      const recordsWithHours = employeeAttendance.map((record) => {
        const checkIn = parseISO(record.checkIn);
        const checkOut = parseISO(record.checkOut!);
        const totalMinutes = Math.max(
          differenceInMinutes(checkOut, checkIn),
          0,
        );
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
          ...record,
          workingHours: hours,
          workingMinutes: minutes,
          totalMinutes,
        };
      });

      const monthlyBreakdownMap = recordsWithHours.reduce(
        (acc, record) => {
          const date = parseISO(record.date);
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, "0")}`;

          if (!acc[monthKey]) {
            acc[monthKey] = {
              month: format(date, "MMMM"),
              year: date.getFullYear(),
              hours: 0,
              minutes: 0,
              daysWorked: 0,
            };
          }

          acc[monthKey].hours += record.workingHours;
          acc[monthKey].minutes += record.workingMinutes;
          acc[monthKey].daysWorked += 1;

          if (acc[monthKey].minutes >= 60) {
            acc[monthKey].hours += Math.floor(acc[monthKey].minutes / 60);
            acc[monthKey].minutes = acc[monthKey].minutes % 60;
          }

          return acc;
        },
        {} as Record<
          string,
          {
            month: string;
            year: number;
            hours: number;
            minutes: number;
            daysWorked: number;
          }
        >,
      );

      const totalMinutes = recordsWithHours.reduce(
        (sum, record) => sum + record.totalMinutes,
        0,
      );

      return {
        employee,
        totalHours: Math.floor(totalMinutes / 60),
        totalMinutes: totalMinutes % 60,
        attendanceRecords: recordsWithHours,
        monthlyBreakdown: Object.values(monthlyBreakdownMap),
      };
    });
  };

  const currentMonthData = useMemo(() => {
    const currentMonthKey = `${selectedYear}-${String(
      selectedMonth + 1,
    ).padStart(2, "0")}`;

    return data.map((item) => {
      const monthData = item.monthlyBreakdown.find((month) => {
        const monthIndex = new Date(
          `${month.month} 1, ${month.year}`,
        ).getMonth();
        const key = `${month.year}-${String(monthIndex + 1).padStart(2, "0")}`;
        return key === currentMonthKey;
      });

      return {
        ...item,
        currentMonthHours: monthData?.hours || 0,
        currentMonthMinutes: monthData?.minutes || 0,
        currentMonthDays: monthData?.daysWorked || 0,
      };
    });
  }, [data, selectedMonth, selectedYear]);

  const totalEmployees = data.length;
  const totalWorkingMinutesThisMonth = currentMonthData.reduce(
    (sum, item) => sum + item.currentMonthHours * 60 + item.currentMonthMinutes,
    0,
  );
  const averageMinutesPerEmployee =
    totalEmployees > 0
      ? Math.round(totalWorkingMinutesThisMonth / totalEmployees)
      : 0;

  const formatWorkingHours = (hours: number, minutes: number) =>
    `${hours}h ${minutes}m`;

  const getEmployeeStatusBadge = (status?: string | null) => {
    const normalized = (status || "").toUpperCase();

    if (normalized === "CHECK_IN") {
      return <Badge className="bg-green-100 text-green-800">Checked In</Badge>;
    }

    return <Badge className="bg-slate-100 text-slate-700">Checked Out</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-lg text-slate-600">Loading working hours...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-lg text-red-600">
              Error loading working hours
            </div>
            <div className="text-gray-600">{error}</div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void fetchWorkingHours()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Employees Working Hours
          </h1>
          <p className="mt-2 text-gray-600">
            Monthly working-hour overview based on attendance records
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void fetchWorkingHours(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {format(new Date(2024, i, 1), "MMMM")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Hours This Month
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatWorkingHours(
                Math.floor(totalWorkingMinutesThisMonth / 60),
                totalWorkingMinutesThisMonth % 60,
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Hours/Employee
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatWorkingHours(
                Math.floor(averageMinutesPerEmployee / 60),
                averageMinutesPerEmployee % 60,
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthData.reduce(
                (sum, item) => sum + item.currentMonthDays,
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Employee Working Hours -{" "}
            {format(new Date(selectedYear, selectedMonth), "MMMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMonthData.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              No employee data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Department
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Days Worked
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Monthly Hours
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Total Hours
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthData.map((item) => (
                    <tr
                      key={item.employee.id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {item.employee.name || item.employee.username}
                          </div>
                          <div className="text-sm text-slate-500">
                            {item.employee.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.employee.department}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.currentMonthDays}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatWorkingHours(
                          item.currentMonthHours,
                          item.currentMonthMinutes,
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatWorkingHours(item.totalHours, item.totalMinutes)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getEmployeeStatusBadge(item.employee.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingHoursPage;
