"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface Request {
  id: string;
  type: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  employee: {
    name: string;
    email: string;
    department: string;
  };
}

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const res = await fetch("http://localhost:5000/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        setError("Access denied. Admin privileges required.");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await res.json();
      setRequests(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login first");
      }

      const res = await fetch(`http://localhost:5000/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          comments: comments.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update request");
      }

      // Update the request in the local state
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status } : req))
      );

      setExpandedRequest(null);
      setComments("");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Request Management</h1>
        <p className="text-gray-600 mt-2">
          Review and manage employee requests
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <React.Fragment key={request.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.type.replace("_", " ")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {request.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.startDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {formatDate(request.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedRequest(
                                expandedRequest === request.id
                                  ? null
                                  : request.id
                              )
                            }
                          >
                            {expandedRequest === request.id ? (
                              <ChevronUp className="w-4 h-4 mr-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 mr-1" />
                            )}
                            {expandedRequest === request.id ? "Hide" : "View"}
                          </Button>
                        </td>
                      </tr>

                      {expandedRequest === request.id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              {/* Details */}
                              <div className="grid grid-cols-2 gap-4">
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
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">
                                    Request Type
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {request.type.replace("_", " ")}
                                  </p>
                                </div>
                              </div>

                              {/* Title & Description */}
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

                              {/* Dates */}
                              <div className="grid grid-cols-2 gap-4">
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

                              {/* Actions */}
                              {request.status === "PENDING" && (
                                <div className="space-y-4 pt-4 border-t">
                                  <div>
                                    <Label htmlFor={`comments-${request.id}`}>
                                      Comments (Optional)
                                    </Label>
                                    <Textarea
                                      id={`comments-${request.id}`}
                                      value={comments}
                                      onChange={(e) =>
                                        setComments(e.target.value)
                                      }
                                      placeholder="Add any comments for the employee..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex space-x-2">
                                    <Button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          request.id,
                                          "APPROVED"
                                        )
                                      }
                                      disabled={actionLoading}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      {actionLoading
                                        ? "Processing..."
                                        : "Approve"}
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          request.id,
                                          "REJECTED"
                                        )
                                      }
                                      disabled={actionLoading}
                                      variant="destructive"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      {actionLoading
                                        ? "Processing..."
                                        : "Reject"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default AdminRequestsPage;
