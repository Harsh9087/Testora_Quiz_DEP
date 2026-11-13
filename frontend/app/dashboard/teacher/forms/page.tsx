import { redirect } from "next/navigation";

export default function TeacherFormsRedirect() {
  redirect("/dashboard/teacher#forms");
}

