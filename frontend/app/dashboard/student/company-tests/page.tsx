import { redirect } from "next/navigation";

export default function StudentCompanyTestsRedirect() {
  redirect("/dashboard/student?tab=company-tests");
}

