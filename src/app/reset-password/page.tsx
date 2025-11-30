import ResetPasswordForm from "./ResetPasswordForm";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage(props: Props) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 text-gray-600">Enter your new password</p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

