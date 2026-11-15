import { redirect } from "next/navigation";

export default function TeacherReportsRedirect() {
  redirect("/dashboard/teacher?tab=reports");
}

