import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Lupa kata sandi",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/akun");

  return <ForgotPasswordForm />;
}
