import { redirect } from "next/navigation";

export default function TeacherKnowledgeBaseRedirect() {
  redirect("/dashboard/teacher?tab=kb");
}

