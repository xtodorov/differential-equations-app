import { currentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { AuthForm } from "@/components/auth-form";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ page?: string[] }>;
}) {
  const { page = [] } = await params;
  const section = page[0] || "dashboard";
  if (
    ![
      "dashboard",
      "login",
      "register",
      "onboarding",
      "learn",
      "lessons",
      "practice",
      "lab",
      "progress",
      "settings",
      "billing",
      "professor",
    ].includes(section)
  )
    notFound();
  const user = await currentUser();
  if (section === "login" || section === "register") {
    if (user) redirect(user.profile ? "/dashboard" : "/onboarding");
    return <AuthForm register={section === "register"} />;
  }
  if (!user) redirect("/login");
  if (!user.profile && section !== "onboarding") redirect("/onboarding");
  return <Workspace section={section} lessonId={page[1]} name={user.name} />;
}
