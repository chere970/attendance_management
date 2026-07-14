import { SignupForm } from "@/components/signup-form";
import { Brand } from "@/components/brand";

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Brand className="self-center" />
        <SignupForm />
      </div>
    </div>
  );
}
