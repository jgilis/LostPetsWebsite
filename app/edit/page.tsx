"use client";

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