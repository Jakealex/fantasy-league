import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sign Up</h1>
          <p className="mt-2 text-gray-600">Create your account to join the fantasy league</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}

