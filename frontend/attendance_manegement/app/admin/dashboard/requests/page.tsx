"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
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
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    employeeId?: string;
  };
}

const typeLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getStatusBadge = (status: string) => {
  switch (status) {
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  }
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [commentsByRequest, setCommentsByRequest] = useState<
    Record<string, string>
  >({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "PENDING").length,
    [requests],
  );

  useEffect(() => {
    void fetchRequests();
  }, []);

  const fetchRequests = async (showRefreshing = false) => {
    const token = getStoredToken();

    if (!token) {
      router.push("/employee/login");
      return;
    }

    try {
      setError("");
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await apiFetch<RequestItem[]>("/requests", {
        token,
        cache: "no-store",
      });

      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    const token = getStoredToken();

    if (!token) {
      router.push("/employee/login");
      return;
    }

    try {
      setError("");
      setActionLoadingId(requestId);

      const updated = await apiFetch<RequestItem>(`/requests/${requestId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status,
          comments: commentsByRequest[requestId]?.trim() || undefined,
        }),
      });

      setRequests((prev) =>
        prev.map((request) => (request.id === requestId ? updated : request)),
      );
      setExpandedRequest(null);
      setCommentsByRequest((prev) => ({ ...prev, [requestId]: "" }));
    } catch (err: any) {
      setError(err.message || "Failed to update request");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-lg text-slate-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Request Management
          </h1>
          <p className="mt-2 text-gray-600">
            Review and manage employee requests
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
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No requests
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no requests to review at this time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.map((request) => {
                    const isExpanded = expandedRequest === request.id;
                    const isActing = actionLoadingId === request.id;

                    return (
                      <React.Fragment key={request.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.employee.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.employee.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.employee.department}
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {typeLabel(request.type)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="max-w-xs truncate text-sm text-gray-900">
                              {request.title}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatDate(request.startDate)}
                            </div>
                            <div className="text-sm text-gray-500">
                              to {formatDate(request.endDate)}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            {getStatusBadge(request.status)}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setExpandedRequest(
                                  isExpanded ? null : request.id,
                                )
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="mr-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="mr-1 h-4 w-4" />
                              )}
                              {isExpanded ? "Hide" : "View"}
                            </Button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50 px-6 py-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Employee Details
                                    </Label>
                                    <p className="text-sm text-gray-600">
                                      {request.employee.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {request.employee.email}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {request.employee.department}
                                    </p>
                                    {request.employee.employeeId && (
                                      <p className="text-sm text-gray-600">
                                        ID: {request.employee.employeeId}
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium">
                                      Request Type
                                    </Label>
                                    <p className="text-sm text-gray-600">
                                      {typeLabel(request.type)}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">
                                    Title
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {request.title}
                                  </p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">
                                    Description
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {request.description}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Start Date
                                    </Label>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(request.startDate)}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      End Date
                                    </Label>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(request.endDate)}
                                    </p>
                                  </div>
                                </div>

                                {request.comments &&
                                  request.status !== "PENDING" && (
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Admin Comments
                                      </Label>
                                      <p className="text-sm text-gray-600">
                                        {request.comments}
                                      </p>
                                    </div>
                                  )}

                                {request.status === "PENDING" && (
                                  <div className="space-y-4 border-t pt-4">
                                    <div>
                                      <Label htmlFor={`comments-${request.id}`}>
                                        Comments (Optional)
                                      </Label>
                                      <Textarea
                                        id={`comments-${request.id}`}
                                        value={
                                          commentsByRequest[request.id] || ""
                                        }
                                        onChange={(e) =>
                                          setCommentsByRequest((prev) => ({
                                            ...prev,
                                            [request.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Add any comments for the employee..."
                                        rows={3}
                                      />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        onClick={() =>
                                          void handleStatusUpdate(
                                            request.id,
                                            "APPROVED",
                                          )
                                        }
                                        disabled={isActing}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        {isActing ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                        )}
                                        {isActing ? "Processing..." : "Approve"}
                                      </Button>

                                      <Button
                                        onClick={() =>
                                          void handleStatusUpdate(
                                            request.id,
                                            "REJECTED",
                                          )
                                        }
                                        disabled={isActing}
                                        variant="destructive"
                                      >
                                        {isActing ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <XCircle className="mr-2 h-4 w-4" />
                                        )}
                                        {isActing ? "Processing..." : "Reject"}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
