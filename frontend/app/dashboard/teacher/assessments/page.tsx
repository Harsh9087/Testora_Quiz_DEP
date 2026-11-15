import { redirect } from "next/navigation";

export default function TeacherAssessmentsRedirect() {
  redirect("/dashboard/teacher?tab=exams");
}

