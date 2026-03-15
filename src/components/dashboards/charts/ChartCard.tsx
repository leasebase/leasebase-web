"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DataSource } from "@/services/dashboard/types";

const provenanceLabel: Record<DataSource, string> = {
  live: "Live data",
  stub: "Sample data",
  unavailable: "Data unavailable",
};

export interface ChartCardProps {
  title: string;
  /** Optional link to full view */
  href?: string;
  /** Data provenance — shows a badge when not "live" */
  source?: DataSource;
  children: ReactNode;
  className?: string;
}

/**
 * Standard card wrapper for dashboard chart widgets.
 * Combines the existing Card/CardHeader/CardBody with a
 * provenance badge and optional navigation link.
 */
export function ChartCard({ title, href, source, children, className = "" }: ChartCardProps) {
  if (source === "unavailable") {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <Badge variant="neutral">{provenanceLabel.unavailable}</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-center text-sm text-slate-400">Data unavailable</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <div className="flex items-center gap-2">
            {source && source !== "live" && (
              <Badge variant="neutral">{provenanceLabel[source]}</Badge>
            )}
            {href && (
              <Link href={href} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                View all →
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-2">{children}</CardBody>
    </Card>
  );
}
