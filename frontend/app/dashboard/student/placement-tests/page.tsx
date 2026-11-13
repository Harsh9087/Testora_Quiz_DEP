import { redirect } from "next/navigation";

export default function StudentPlacementTestsRedirect() {
  redirect("/dashboard/student?tab=company-tests");
}
