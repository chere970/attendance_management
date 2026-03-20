"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { apiFetch, getStoredToken } from "@/lib/api";

interface RequestItem {
  id: string;
  type: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  comments?: string | null;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatType = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const RequestHistory = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "PENDING").length,
    [requests],
  );

  const fetchRequests = async (showRefreshing = false) => {
    const token = getStoredToken();

    if (!token) {
      setError("Please login first");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await apiFetch<RequestItem[]>("/requests/my-requests", {
        method: "GET",
        token,
        cache: "no-store",
      });

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  if (loading) {
    return <div className="p-4 text-slate-600">Loading requests...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          {error}
        </div>
        <Button variant="outline" onClick={() => void fetchRequests()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Requests History</h2>
          <p className="text-sm text-slate-600">
            Track your submitted requests and approval status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-slate-100 text-slate-700">
            Pending: {pendingCount}
          </Badge>
          <Button
            variant="outline"
            onClick={() => void fetchRequests(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="text-gray-500">No requests found.</p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  <CardDescription>
                    {formatType(request.type)} • {formatDate(request.startDate)}{" "}
                    - {formatDate(request.endDate)}
                  </CardDescription>
                </div>

                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <p className="mb-3 text-sm text-gray-600">
                {request.description}
              </p>

              <div className="space-y-2 text-xs text-gray-500">
                <p>Submitted: {formatDate(request.createdAt)}</p>

                {request.comments ? (
                  <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                    <strong>Admin Comments:</strong> {request.comments}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default RequestHistory;
