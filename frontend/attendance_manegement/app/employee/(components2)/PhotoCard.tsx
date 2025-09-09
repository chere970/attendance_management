"use client";

import React, { useState, useEffect } from "react";
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
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EmployeeProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  department: string;
  photo: string;
  status: string;
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
    fetchEmployeeProfile();
  }, []);

  const fetchEmployeeProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/employee/login");
        return;
      }

      // Decode token to get user ID
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId;

      const response = await fetch(`http://localhost:5000/prisma/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const userData = await response.json();
      setEmployee(userData);
    } catch (err: any) {
      console.error("Failed to load employee profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CHECK_IN":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Checked In
          </Badge>
        );
      case "CHECK_OUT":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Checked Out
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case "employee":
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
            <User className="w-3 h-3 mr-1" />
            Employee
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className={`${compact ? "w-64" : "w-80"} mx-auto`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
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
            <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
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
      } mx-auto shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50 border-0 overflow-hidden`}
    >
      {/* Decorative top gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-16 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-2 right-2">
          <div className="w-8 h-8 bg-white/20 rounded-full blur-sm"></div>
        </div>
      </div>

      <CardContent className="p-6 -mt-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Profile Photo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-gray-100 flex items-center justify-center shadow-xl ring-4 ring-blue-100 transition-all duration-300 hover:ring-blue-200">
              {employee.photo ? (
                <img
                  src={employee.photo}
                  alt={employee.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            {/* Online status indicator */}
            <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            {showActions && (
              <button className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
                <Camera className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Employee Information */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
            <p className="text-sm text-gray-600">@{employee.username}</p>

            <div className="flex flex-col items-center space-y-2">
              {getRoleBadge(employee.role)}
              {getStatusBadge(employee.status)}
            </div>

            <div className="pt-2 space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Department:</span>{" "}
                {employee.department}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                ID: {employee.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex space-x-2 w-full pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push("/employee/profile")}
              >
                <Edit className="w-3 h-3 mr-1" />
                View Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push("/employee/attendance")}
              >
                <Clock className="w-3 h-3 mr-1" />
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
