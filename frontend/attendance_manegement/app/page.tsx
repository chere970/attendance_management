"use client";
import { GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-5" />
          </div>
          <span className="text-xl font-bold">Attendance Management</span>
        </div>

        {/* Welcome Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Welcome to Attendance Management
            </CardTitle>
            <CardDescription>
              Manage your employee attendance efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button
                onClick={() => router.push("/employee/login")}
                className="w-full h-12 text-lg"
                size="lg"
              >
                Login
              </Button>
              <Button
                onClick={() => router.push("/employee/signup")}
                variant="outline"
                className="w-full h-12 text-lg"
                size="lg"
              >
                Signup
              </Button>
            </div>

            {/* <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Admin Access
              </span>
            </div> */}

            {/* <Button
              onClick={() => router.push("/admin/dashboard")}
              variant="secondary"
              className="w-full h-12 text-lg"
              size="lg"
            >
              Admin Dashboard
            </Button> */}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Easy Check-in/out</h3>
            <p className="text-sm text-gray-600">
              Quick and simple attendance tracking
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Real-time Reports</h3>
            <p className="text-sm text-gray-600">
              Live attendance monitoring and analytics
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-sm text-gray-600">
              Protected data with role-based access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
