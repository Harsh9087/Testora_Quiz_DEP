import { redirect } from "next/navigation";

export default function StudentCertificatesRedirect() {
  redirect("/dashboard/student?tab=certificates");
}
