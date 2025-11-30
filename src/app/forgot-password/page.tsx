import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Forgot Password</h1>
          <p className="mt-2 text-gray-600">Enter your email to receive a password reset link</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

