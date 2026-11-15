import { redirect } from "next/navigation";

export default function TeacherMockTestsRedirect() {
  redirect("/dashboard/teacher?tab=mock-tests");
}
