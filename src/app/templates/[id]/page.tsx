"use client";

import { use } from "react";
import { TemplateForm } from "@/components/template-form";

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TemplateForm templateId={id} />;
}
