"use client";

import { useState } from "react";
import { X, Building2, DoorOpen, Users, CheckCircle2, ArrowRight } from "lucide-react";

interface OnboardingWalkthroughProps {
  onDismiss: () => void;
  onStartSetup: () => void;
  currentStep?: string;
}

const steps = [
  {
    id: "welcome",
    icon: <CheckCircle2 size={32} className="text-emerald-400" />,
    title: "Welcome to Leasebase!",
    description:
      "Let's get your account set up. We'll walk you through adding your first property, configuring units, and inviting tenants.",
  },
  {
    id: "add_property",
    icon: <Building2 size={32} className="text-brand-400" />,
    title: "Add your first property",
    description:
      "Start by adding a property — give it a name, address, type, and the number of units it has.",
  },
  {
    id: "add_units",
    icon: <DoorOpen size={32} className="text-blue-400" />,
    title: "Set up your units",
    description:
      "After adding a property, configure each unit with details like bedrooms, bathrooms, and rent amount.",
  },
  {
    id: "add_tenants",
    icon: <Users size={32} className="text-purple-400" />,
    title: "Invite your tenants",
    description:
      "Add tenant information and optionally send them an invitation email so they can access their portal.",
  },
];

export function OnboardingWalkthrough({
  onDismiss,
  onStartSetup,
  currentStep,
}: OnboardingWalkthroughProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const isLastSlide = slideIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onStartSetup();
    } else {
      setSlideIndex((i) => i + 1);
    }
  };

  const step = steps[slideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Dismiss walkthrough"
        >
          <X size={18} />
        </button>

        {/* Step indicator */}
        <div className="mb-4 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= slideIndex ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{step.icon}</div>
          <h2 className="text-xl font-semibold text-slate-100">{step.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            {isLastSlide ? "Get started" : "Next"}
            <ArrowRight size={14} />
          </button>
        </div>

        {slideIndex > 0 && (
          <button
            type="button"
            onClick={() => setSlideIndex((i) => i - 1)}
            className="mt-2 block w-full text-center text-xs text-slate-500 hover:text-slate-300"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
