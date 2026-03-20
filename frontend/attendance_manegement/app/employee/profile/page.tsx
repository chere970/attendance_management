"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Calendar,
  Clock,
  Building,
  Shield,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  API_URL,
  apiFetch,
  decodeJwtPayload,
  getStoredToken,
  isAdmin,
  withApiAssetUrl,
} from "@/lib/api";

interface UserProfile {
  id: string;
  name: string;
  employeeId: string;
  username: string;
  email: string;
  role: string;
  department: string;
  photo: string;
  fingerprint: string;
  status: string;
  createdAt?: string;
}

type JwtPayload = {
  userId?: string;
  email?: string;
  role?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ProfilePage = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const router = useRouter();

  const token = useMemo(() => getStoredToken(), []);

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        router.push("/employee/login");
        return;
      }

      const payload = decodeJwtPayload<JwtPayload>(token);
      const userId = payload?.userId;

      if (!userId) {
        throw new Error("Unable to determine the logged in user.");
      }

      const userData = await apiFetch<UserProfile>(
        `/prisma/${encodeURIComponent(userId)}`,
        {
          token,
          cache: "no-store",
        },
      );

      setUser({
        ...userData,
        photo: withApiAssetUrl(userData.photo),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG, WEBP, or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than or equal to 5MB.");
      event.target.value = "";
      return;
    }

    setUploadingPhoto(true);

    try {
      if (!token) {
        throw new Error("Please login first.");
      }

      const payload = decodeJwtPayload<JwtPayload>(token);
      const userId = payload?.userId;

      if (!userId) {
        throw new Error("Unable to determine the logged in user.");
      }

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(
        `${API_URL}/prisma/${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload photo");
      }

      const updatedUser = data as UserProfile;
      setUser({
        ...updatedUser,
        photo: withApiAssetUrl(updatedUser.photo),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "CHECK_IN":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Checked In
          </Badge>
        );
      case "CHECK_OUT":
      default:
        return (
          <Badge className="border-gray-200 bg-gray-100 text-gray-800">
            <XCircle className="mr-1 h-3 w-3" />
            Checked Out
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    if (isAdmin(role)) {
      return (
        <Badge className="border-red-200 bg-red-100 text-red-800">
          <Shield className="mr-1 h-3 w-3" />
          Administrator
        </Badge>
      );
    }

    return (
      <Badge className="border-blue-200 bg-blue-100 text-blue-800">
        <User className="mr-1 h-3 w-3" />
        Employee
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-lg text-red-500">
              Error loading profile
            </div>
            <div className="text-gray-600">{error}</div>
            <Button
              onClick={fetchUserProfile}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-500">
              No profile data available
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="relative inline-block">
                  <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100">
                    {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}

                    {uploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    disabled={uploadingPhoto}
                    onClick={() =>
                      document.getElementById("photo-upload")?.click()
                    }
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {user.name}
                </h2>
                <p className="mb-2 text-gray-600">@{user.username}</p>

                <div className="mb-4 flex justify-center space-x-2">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.status)}
                </div>

                <p className="text-xs text-gray-500">
                  Upload-safe photo handling enabled
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <User className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Full Name
                      </p>
                      <p className="text-sm text-gray-600">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Building className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Department
                      </p>
                      <p className="text-sm text-gray-600">{user.department}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Shield className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Role</p>
                      <p className="text-sm text-gray-600">
                        {isAdmin(user.role) ? "Administrator" : "Employee"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Employee ID
                      </p>
                      <p className="text-sm text-gray-600">{user.employeeId}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Attendance Status
                      </p>
                      <p className="text-sm text-gray-600">{user.status}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Username</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    @{user.username}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {user.department}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {isAdmin(user.role) ? "Admin" : "Employee"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
