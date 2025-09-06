"use client";
import React, { useEffect, useState } from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type Summary = {
  totalEmployees: number;
  onDuty: number;
  todaysCheckIns: number;
  checkInsPerDay: { date: string; count: number }[];
};

export default function AttendanceSummary() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/prisma/summary", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load summary");
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e.message || "Error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-4">Loading summary…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!data) return null;

  const labels = data.checkInsPerDay.map((d) =>
    format(parseISO(d.date), "MMM d")
  );
  const dataset = {
    labels,
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
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-sm text-gray-500">Total employees</div>
          <div className="text-2xl font-bold">{data.totalEmployees}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-sm text-gray-500">On duty</div>
          <div className="text-2xl font-bold text-emerald-600">
            {data.onDuty}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-sm text-gray-500">Check-ins today</div>
          <div className="text-2xl font-bold">{data.todaysCheckIns}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm text-gray-700 mb-2">Last 7 days — check-ins</h3>
        <Line data={dataset} />
      </div>
    </div>
  );
}
