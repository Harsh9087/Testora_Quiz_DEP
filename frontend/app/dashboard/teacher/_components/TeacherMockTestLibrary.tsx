"use client";

import React from "react";
import MockTestLibrary from "@/app/dashboard/student/_components/MockTestLibrary";

/**
 * TeacherMockTestLibrary
 * 
 * Provides teachers with the identical standardized platform Mock Test Library
 * curated by Super Admin (same as in Student Mode).
 * 
 * Tests are managed centrally via Super Admin, allowing teachers to browse,
 * practice, filter, and review full-length free mock test papers.
 */
export default function TeacherMockTestLibrary() {
  return <MockTestLibrary />;
}
