import { redirect } from "next/navigation";

export default function TeacherCreateRedirect() {
  redirect("/dashboard/teacher?tab=create");
}

