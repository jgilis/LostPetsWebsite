"use client";

/** Mutation surface for report delete (and future edit). Reachable from /report/[id] Edit only. */
import { Suspense } from "react";
import EditContent from "./EditContent";

export const dynamic = "force-dynamic";

export default function EditPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <EditContent />
    </Suspense>
  );
}