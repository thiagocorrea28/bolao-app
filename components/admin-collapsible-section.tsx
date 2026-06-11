"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function AdminCollapsibleSection({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="surface p-4">
      <button
        className="flex w-full items-center justify-between gap-3 text-left lg:pointer-events-none"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex items-center gap-2">
          {icon}
          <span className="text-lg font-black">{title}</span>
        </span>
        <ChevronDown
          className={`transition lg:hidden ${open ? "rotate-180" : ""}`}
          size={20}
        />
      </button>

      <div className={`${open ? "mt-4 block" : "hidden"} lg:mt-4 lg:block`}>{children}</div>
    </section>
  );
}
