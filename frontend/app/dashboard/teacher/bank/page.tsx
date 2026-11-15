import { redirect } from "next/navigation";

export default function TeacherQuestionBankRedirect() {
  redirect("/dashboard/teacher?tab=bank");
}

