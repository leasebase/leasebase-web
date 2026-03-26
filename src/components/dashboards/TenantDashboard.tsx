"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Calendar,
  FileText,
  Wrench,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import type { TenantDashboardData, TenantDashboardViewModel } from "@/services/tenant/types";
import { fetchTenantDashboard } from "@/services/tenant/tenantDashboardService";
import { toTenantDashboardViewModel } from "@/services/tenant/viewModel";
import { TenantDashboardSkeleton } from "./tenant/TenantDashboardSkeleton";
import { TenantEmptyState } from "./tenant/TenantEmptyState";

export function TenantDashboard() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchTenantDashboard();
        if (!cancelled) setData(result);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <TenantDashboardSkeleton />;

  if (error) {
    return (
      <section className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      </section>
    );
  }

  if (!data) return null;

  // Progressive empty state for non-active setup stages
  if (data.setupStage !== "active") {
    return (
      <section className="space-y-6">
        <TenantEmptyState stage={data.setupStage} lease={data.lease} />
      </section>
    );
  }

  const vm: TenantDashboardViewModel = toTenantDashboardViewModel(data);

  // Derive display values from view model
  const firstName = data.profile?.name?.split(" ")[0] || "there";
  const propertyName = vm.kpiHeader.propertyName !== "\u2014" ? vm.kpiHeader.propertyName : "";
  const unitLabel = vm.kpiHeader.leaseUnit !== "\u2014" ? vm.kpiHeader.leaseUnit : "";

  // Rent status
  const isPaid = vm.kpiHeader.paymentStatus === "paid";
  const isOverdue = vm.kpiHeader.paymentStatus === "overdue" || vm.kpiHeader.paymentStatus === "failed";
  const isDueSoon = vm.kpiHeader.paymentStatus === "due-soon";

  // Maintenance — open requests
  const activeStatuses = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS"];
  const openRequests = data.maintenanceRequests.filter((r) => activeStatuses.includes(r.status));

  // Unread notifications
  const unreadNotifications = data.notifications.filter((n) => !n.read_at);

  return (
    <div className="space-y-6">
      {/* ── Welcome Card ── */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-md p-6">
        <h1 className="text-[24px] font-semibold text-slate-900 mb-1">
          Welcome back, {firstName}!
        </h1>
        <p className="text-[14px] text-slate-600 mb-3">
          Everything you need for {propertyName}{unitLabel ? `, Unit ${unitLabel}` : ""}
        </p>
        <div className="flex flex-wrap gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-700 font-medium">Lease Active</span>
          </div>
          {vm.kpiHeader.leaseDates !== "\u2014" && (
            <div className="text-slate-500">
              <span className="text-slate-700 font-medium">Period:</span> {vm.kpiHeader.leaseDates}
            </div>
          )}
        </div>
      </div>

      {/* ── Rent Status — Prominent Card ── */}
      <div className={`rounded-2xl border shadow-lg overflow-hidden ${
        isOverdue
          ? "bg-gradient-to-br from-red-50 via-white to-red-50/30 border-red-200"
          : isPaid
          ? "bg-gradient-to-br from-green-50 via-white to-green-50/30 border-green-200"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-50 border-slate-200"
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-[16px] font-semibold text-slate-900">Rent Payment</h2>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide shadow-sm ${
                  isOverdue
                    ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                    : isPaid
                    ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                    : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                }`}>
                  {vm.kpiHeader.paymentStatusLabel}
                </span>
              </div>
              <p className="text-[13px] text-slate-600">
                {isPaid ? "Next payment" : "Current payment"} &bull; Due {vm.kpiHeader.dueDate}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
              isOverdue
                ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30"
                : isPaid
                ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30"
                : "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-600/30"
            }`}>
              <DollarSign className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[36px] font-bold text-slate-900">
                {vm.kpiHeader.rentAmount}
              </span>
              <span className="text-[14px] text-slate-600 font-medium">
                {isPaid ? "paid" : "due"}
              </span>
            </div>
            {!isPaid && (
              <p className={`text-[13px] font-medium ${
                isOverdue ? "text-red-700" : isDueSoon ? "text-amber-700" : "text-slate-600"
              }`}>
                {isOverdue ? "Payment is overdue" : `Due ${vm.kpiHeader.dueDate}`}
              </p>
            )}
          </div>

          {!isPaid ? (
            <Link
              href="/app/pay-rent"
              className="flex items-center justify-center gap-2 w-full h-12 bg-gradient-to-r from-green-600 to-green-700 text-white text-[14px] font-semibold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transition-all"
            >
              <CreditCard className="w-5 h-5" strokeWidth={2.5} />
              Pay Rent Now
            </Link>
          ) : (
            <Link
              href="/app/payment-history"
              className="flex items-center justify-center gap-2 w-full h-12 bg-white text-slate-700 text-[14px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              View Payment History
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Two Column Grid: Lease Summary + Maintenance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lease Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">Lease Summary</h3>
              <Link
                href="/app/leases"
                className="text-[12px] text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
              >
                View Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-500 font-medium mb-0.5">Lease Period</p>
                <p className="text-[14px] font-semibold text-slate-900">{vm.kpiHeader.leaseDates}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-500 font-medium mb-0.5">Monthly Rent</p>
                <p className="text-[14px] font-semibold text-slate-900">{vm.kpiHeader.rentAmount}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-violet-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-500 font-medium mb-0.5">Lease Status</p>
                <p className="text-[14px] font-semibold text-green-700">{vm.kpiHeader.leaseStatus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">Maintenance Requests</h3>
              <Link
                href="/app/maintenance"
                className="text-[12px] text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="p-5">
            {openRequests.length > 0 ? (
              <div className="space-y-3">
                {openRequests.slice(0, 2).map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-50/50 border border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-[13px] font-semibold text-slate-900 flex-1">
                        {request.title || request.description}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                        request.status === "IN_PROGRESS" || request.status === "SCHEDULED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {request.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 mb-2 line-clamp-2">{request.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted {new Date(request.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                ))}
                <Link
                  href="/app/maintenance/new"
                  className="flex items-center justify-center gap-2 w-full h-10 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <Wrench className="w-4 h-4" />
                  Submit New Request
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-[13px] text-slate-600 mb-4">No open maintenance requests</p>
                <Link
                  href="/app/maintenance/new"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <Wrench className="w-4 h-4" />
                  Submit Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Notifications Preview ── */}
      {unreadNotifications.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/30 rounded-2xl border border-blue-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-slate-900">Unread Notifications</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full">
                  {unreadNotifications.length}
                </span>
              </div>
              <Link
                href="/app/notifications"
                className="text-[12px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {unreadNotifications.slice(0, 3).map((notification) => {
              const typeKey = notification.related_type || notification.type;
              const isMaint = typeKey === "work_order" || typeKey === "maintenance";
              const isPay = typeKey === "payment";
              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMaint ? "bg-amber-50" : isPay ? "bg-green-50" : "bg-blue-50"
                  }`}>
                    {isMaint && <Wrench className="w-4 h-4 text-amber-600" />}
                    {isPay && <DollarSign className="w-4 h-4 text-green-600" />}
                    {!isMaint && !isPay && <Bell className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 mb-0.5">{notification.title}</p>
                    <p className="text-[12px] text-slate-600 truncate">{notification.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Activity Timeline ── */}
      {vm.notifications.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-[15px] font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {vm.notifications.items.slice(0, 6).map((item, index) => {
                const total = Math.min(vm.notifications.items.length, 6);
                const isLast = index === total - 1;
                const isPay = item.link?.includes("payment");
                const isMaint = item.link?.includes("maintenance");
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                        isPay ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30" :
                        isMaint ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30" :
                        "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30"
                      }`}>
                        {isPay && <DollarSign className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />}
                        {isMaint && <Wrench className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />}
                        {!isPay && !isMaint && <Bell className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />}
                      </div>
                      {!isLast && <div className="w-px h-full bg-slate-200 mt-2" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-[13px] font-semibold text-slate-900 mb-0.5">{item.title}</p>
                      <p className="text-[12px] text-slate-600 mb-1 truncate">{item.body}</p>
                      <span className="text-[11px] text-slate-500 font-medium">{item.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
