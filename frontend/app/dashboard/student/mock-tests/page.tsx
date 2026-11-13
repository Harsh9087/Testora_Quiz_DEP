import { redirect } from "next/navigation";

export default function StudentMockTestsRedirect() {
  redirect("/dashboard/student?tab=mock-tests");
}

