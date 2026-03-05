"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  RadioGroup,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Checkbox,
  Switch,
  Tabs,
  Breadcrumb,
  Pagination,
  EmptyState,
  Skeleton,
  SkeletonCard,
  Avatar,
  DropdownMenu,
  PageHeader,
  Tooltip,
} from "@/components/ui";
import { Settings, Trash2, Edit, MoreVertical, Search } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 border-b border-slate-800 pb-2 text-lg font-semibold text-slate-100">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DevComponentsPage() {
  const [radioVal, setRadioVal] = useState("a");
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(false);
  const [page, setPage] = useState(3);

  return (
    <>
      <PageHeader
        title="Component Showcase"
        description="All LeaseBase UI primitives rendered with live examples."
      />

      <div className="mt-8 space-y-0">
        {/* Buttons */}
        <Section title="Button">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Input">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" placeholder="you@example.com" />
            <Input label="With error" error="This field is required" />
            <Input label="With helper" helperText="We'll never share your email." />
            <Input label="Disabled" disabled value="Locked value" />
          </div>
        </Section>

        {/* Textarea */}
        <Section title="Textarea">
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea label="Description" placeholder="Enter a description…" />
            <Textarea label="With error" error="Too short" />
          </div>
        </Section>

        {/* Select */}
        <Section title="Select">
          <div className="max-w-xs">
            <Select label="Property type">
              <option value="">Choose…</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed-use</option>
            </Select>
          </div>
        </Section>

        {/* Radio */}
        <Section title="RadioGroup">
          <div className="flex gap-8">
            <RadioGroup
              name="demo-radio"
              label="Lease type"
              options={[
                { value: "a", label: "Fixed term" },
                { value: "b", label: "Month-to-month" },
                { value: "c", label: "Sublease", disabled: true },
              ]}
              value={radioVal}
              onChange={setRadioVal}
            />
            <RadioGroup
              name="demo-radio-h"
              label="Orientation: horizontal"
              orientation="horizontal"
              options={[
                { value: "a", label: "Yes" },
                { value: "b", label: "No" },
              ]}
              value="a"
            />
          </div>
        </Section>

        {/* Checkbox + Switch */}
        <Section title="Checkbox & Switch">
          <div className="flex gap-8">
            <Checkbox
              label="Accept terms"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <Switch
              label="Notifications"
              checked={switched}
              onChange={(val) => setSwitched(val)}
            />
          </div>
        </Section>

        {/* Badge */}
        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">Default</Badge>
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="danger">Overdue</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </Section>

        {/* Card */}
        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Card Title</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-slate-300">Card content goes here.</p>
              </CardBody>
            </Card>
            <SkeletonCard />
          </div>
        </Section>

        {/* Tabs */}
        <Section title="Tabs">
          <Tabs
            items={[
              { id: "overview", label: "Overview", content: <p className="text-sm text-slate-300">Overview content.</p> },
              { id: "details", label: "Details", content: <p className="text-sm text-slate-300">Detailed information.</p> },
              { id: "disabled", label: "Disabled", content: <p>—</p>, disabled: true },
            ]}
          />
        </Section>

        {/* Breadcrumb */}
        <Section title="Breadcrumb">
          <Breadcrumb
            items={[
              { label: "Home", href: "/app" },
              { label: "Properties", href: "/app/properties" },
              { label: "Sunrise Apartments" },
            ]}
          />
        </Section>

        {/* Pagination */}
        <Section title="Pagination">
          <Pagination page={page} totalPages={10} onPageChange={setPage} />
          <p className="mt-2 text-xs text-slate-400">Current page: {page}</p>
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <div className="flex items-center gap-3">
            <Avatar name="Rachid Abadli" size="xs" />
            <Avatar name="Rachid Abadli" size="sm" />
            <Avatar name="Rachid Abadli" size="md" />
            <Avatar name="Rachid Abadli" size="lg" />
            <Avatar name="Rachid Abadli" size="xl" />
          </div>
        </Section>

        {/* DropdownMenu */}
        <Section title="DropdownMenu">
          <DropdownMenu
            trigger={
              <button className="rounded p-2 text-slate-300 hover:bg-slate-800">
                <MoreVertical size={18} />
              </button>
            }
            items={[
              { id: "edit", label: "Edit", icon: <Edit size={14} /> },
              { id: "settings", label: "Settings", icon: <Settings size={14} /> },
              { id: "delete", label: "Delete", icon: <Trash2 size={14} />, danger: true },
            ]}
          />
        </Section>

        {/* Tooltip */}
        <Section title="Tooltip">
          <Tooltip content="This is a tooltip">
            <Button variant="secondary">Hover me</Button>
          </Tooltip>
        </Section>

        {/* EmptyState */}
        <Section title="EmptyState">
          <EmptyState
            title="No properties yet"
            description="Add your first property to get started."
            action={<Button variant="primary" size="sm">Add Property</Button>}
          />
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton">
          <div className="space-y-3 max-w-md">
            <Skeleton variant="text" className="h-5 w-1/2" />
            <Skeleton variant="text" className="h-4 w-3/4" />
            <Skeleton variant="circular" className="h-10 w-10" />
            <Skeleton variant="rectangular" className="h-24 w-full" />
          </div>
        </Section>

        {/* PageHeader */}
        <Section title="PageHeader">
          <PageHeader
            title="Sample Page"
            description="With an action button."
            actions={
              <Button variant="primary" size="sm" icon={<Search size={14} />}>
                Search
              </Button>
            }
          />
        </Section>
      </div>
    </>
  );
}
