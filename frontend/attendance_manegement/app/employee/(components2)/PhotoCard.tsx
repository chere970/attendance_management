"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  decodeJwtPayload,
  getStoredToken,
  isAdmin,
  withApiAssetUrl,
} from "@/lib/api";

interface EmployeeProfile {
  id: string;
  name: string;
  employeeId: string;
  username: string;
  email: string;
  role: string;
  department: string;
  photo: string;
  status: string;
}

interface JwtPayload {
  userId?: string;
  email?: string;
  role?: string;
}

interface PhotoCardProps {
  showActions?: boolean;
  compact?: boolean;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  showActions = true,
  compact = false,
}) => {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    void fetchEmployeeProfile();
  }, []);

  const fetchEmployeeProfile = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        router.push("/employee/login");
        return;
      }

      const payload = decodeJwtPayload<JwtPayload>(token);
      const userId = payload?.userId;

      if (!userId) {
        throw new Error("Unable to determine the logged in user.");
      }

      const userData = await apiFetch<EmployeeProfile>(
        `/prisma/${encodeURIComponent(userId)}`,
        {
          token,
          cache: "no-store",
        },
      );

      setEmployee({
        ...userData,
        photo: withApiAssetUrl(userData.photo),
      });
    } catch (err) {
      console.error("Failed to load employee profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "CHECK_IN":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800 text-xs">
            <CheckCircle className="mr-1 h-3 w-3" />
            Checked In
          </Badge>
        );
      case "CHECK_OUT":
      default:
        return (
          <Badge className="border-gray-200 bg-gray-100 text-gray-800 text-xs">
            <XCircle className="mr-1 h-3 w-3" />
            Checked Out
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    if (isAdmin(role)) {
      return (
        <Badge className="border-red-200 bg-red-100 text-red-800 text-xs">
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      );
    }

    return (
      <Badge className="border-blue-200 bg-blue-100 text-blue-800 text-xs">
        <User className="mr-1 h-3 w-3" />
        Employee
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className={`${compact ? "w-64" : "w-80"} mx-auto`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!employee) {
    return (
      <Card className={`${compact ? "w-64" : "w-80"} mx-auto`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <User className="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <p className="text-sm">Profile not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${
        compact ? "w-64" : "w-80"
      } mx-auto overflow-hidden border-0 bg-gradient-to-br from-white to-blue-50 shadow-xl transition-all duration-300 hover:shadow-2xl`}
    >
      <div className="relative h-16 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/20 blur-sm" />
      </div>

      <CardContent className="-mt-8 p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-xl ring-4 ring-blue-100 transition-all duration-300 hover:ring-blue-200">
              {employee.photo ? (
                <img
                  src={employee.photo}
                  alt={employee.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>

            <div className="absolute right-1 top-1 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-green-500" />

            {showActions && (
              <button
                type="button"
                onClick={() => router.push("/employee/profile")}
                className="absolute -bottom-1 -right-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                aria-label="View profile"
              >
                <Camera className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="space-y-2 text-center">
            <h3 className="text-lg font-bold text-gray-900">
              {employee.name || "Unknown Employee"}
            </h3>
            <p className="text-sm text-gray-600">@{employee.username}</p>

            <div className="flex flex-col items-center space-y-2">
              {getRoleBadge(employee.role)}
              {getStatusBadge(employee.status)}
            </div>

            <div className="space-y-1 pt-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Department:</span>{" "}
                {employee.department}
              </p>
              <p className="font-mono text-xs text-gray-500">
                ID: {employee.employeeId?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex w-full space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push("/employee/profile")}
              >
                <Eye className="mr-1 h-3 w-3" />
                View Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push("/employee/attendance")}
              >
                <Clock className="mr-1 h-3 w-3" />
                Check In/Out
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoCard;
