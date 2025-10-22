"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, TrendingUp } from "lucide-react";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { parseISO } from "date-fns/parseISO";

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
}

interface WorkingHoursData {
  employee: Employee;
  totalHours: number;
  totalMinutes: number;
  attendanceRecords: AttendanceRecord[];
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
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchWorkingHours();
  }, [selectedMonth, selectedYear]);

  const fetchWorkingHours = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Fetch employees and their attendance records
      const [employeesRes, attendanceRes] = await Promise.all([
        fetch("http://localhost:5000/prisma", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/prisma/attendance/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!employeesRes.ok || !attendanceRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const employees: Employee[] = await employeesRes.json();
      const attendanceRecords: AttendanceRecord[] = await attendanceRes.json();

      // Process the data
      const processedData = processWorkingHoursData(
        employees,
        attendanceRecords
      );
      setData(processedData);
    } catch (err: any) {
      setError(err.message || "Failed to load working hours");
    } finally {
      setLoading(false);
    }
  };

  const processWorkingHoursData = (
    employees: Employee[],
    attendanceRecords: AttendanceRecord[]
  ): WorkingHoursData[] => {
    return employees.map((employee) => {
      // Filter attendance records for this employee
      const employeeAttendance = attendanceRecords.filter(
        (record) => record.employeeId === employee.id && record.checkOut
      );

      // Calculate working hours for each record
      const recordsWithHours = employeeAttendance.map((record) => {
        const checkIn = parseISO(record.checkIn);
        const checkOut = parseISO(record.checkOut!);
        const hours = differenceInHours(checkOut, checkIn);
        const minutes = differenceInMinutes(checkOut, checkIn) % 60;

        return {
          ...record,
          workingHours: hours,
          workingMinutes: minutes,
          totalMinutes: hours * 60 + minutes,
        };
      });

      // Group by month and calculate monthly totals
      const monthlyBreakdown = recordsWithHours.reduce((acc, record) => {
        const date = parseISO(record.date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
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

        return acc;
      }, {} as Record<string, any>);

      // Calculate total hours and minutes
      const totalMinutes = recordsWithHours.reduce(
        (sum, record) => sum + record.totalMinutes,
        0
      );
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;

      return {
        employee,
        totalHours,
        totalMinutes: remainingMinutes,
        attendanceRecords: recordsWithHours,
        monthlyBreakdown: Object.values(monthlyBreakdown),
      };
    });
  };

  const formatWorkingHours = (hours: number, minutes: number) => {
    return `${hours}h ${minutes}m`;
  };

  const getCurrentMonthData = () => {
    const currentMonthKey = `${selectedYear}-${String(
      selectedMonth + 1
    ).padStart(2, "0")}`;
    return data.map((item) => {
      const monthData = item.monthlyBreakdown.find(
        (month) =>
          `${month.year}-${String(
            new Date(`${month.month} 1, ${month.year}`).getMonth() + 1
          ).padStart(2, "0")}` === currentMonthKey
      );

      return {
        ...item,
        currentMonthHours: monthData?.hours || 0,
        currentMonthMinutes: monthData?.minutes || 0,
        currentMonthDays: monthData?.daysWorked || 0,
      };
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading working hours...</div>
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
              Error loading working hours
            </div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const currentMonthData = getCurrentMonthData();
  const totalEmployees = data.length;
  const totalWorkingHours = data.reduce(
    (sum, item) => sum + item.totalHours,
    0
  );
  const averageHoursPerEmployee =
    totalEmployees > 0 ? Math.round(totalWorkingHours / totalEmployees) : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Employees Working Hours
        </h1>
      </div>

      {/* Month/Year Selector */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {format(new Date(2024, i, 1), "MMMM")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              {currentMonthData.reduce(
                (sum, item) => sum + item.currentMonthHours,
                0
              )}
              h
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
            <div className="text-2xl font-bold">{averageHoursPerEmployee}h</div>
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
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Employee Working Hours -{" "}
            {format(new Date(selectedYear, selectedMonth), "MMMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Department
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    Days Worked
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    Monthly Hours
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    Total Hours
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentMonthData.map((item) => (
                  <tr
                    key={item.employee.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">
                          {item.employee.name || item.employee.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.employee.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{item.employee.department}</td>
                    <td className="py-3 px-4 text-center">
                      {item.currentMonthDays}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {formatWorkingHours(
                        item.currentMonthHours,
                        item.currentMonthMinutes
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {formatWorkingHours(item.totalHours, item.totalMinutes)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        className={
                          item.currentMonthHours > 160
                            ? "bg-green-100 text-green-800 border-green-200"
                            : item.currentMonthHours > 120
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {item.currentMonthHours > 160
                          ? "Excellent"
                          : item.currentMonthHours > 120
                          ? "Good"
                          : "Low"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentMonthData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No working hours data available for the selected month
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingHoursPage;
