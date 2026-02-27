import React, { useState } from 'react';
import {
  FileText,
  Gift,
  CheckCircle,
  ListChecks,
  ListOrdered,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import SchemeBenefits from './SchemeBenefits';
import SchemeEligibility from './SchemeEligibility';
import SchemeDocuments from './SchemeDocuments';

function DetailAccordion({ id, title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-gray-50 dark:bg-gray-800/80 text-left font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />}
          {title}
        </span>
        {open ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SchemeDetails({ details }) {
  if (!details) return null;

  const hasOverview = details.overview;
  const hasBenefits = Array.isArray(details.benefits) && details.benefits.length > 0;
  const hasEligibility = Array.isArray(details.eligibility) && details.eligibility.length > 0;
  const hasDocuments = Array.isArray(details.documents) && details.documents.length > 0;
  const hasSteps = Array.isArray(details.steps) && details.steps.length > 0;
  const hasNotes = details.notes;

  return (
    <div className="space-y-4 animate-[fadeIn_0.5s_ease-out_0.05s_both]">
      {hasOverview && (
        <DetailAccordion
          title="Overview"
          icon={FileText}
          defaultOpen
        >
          <p className="leading-relaxed">{details.overview}</p>
        </DetailAccordion>
      )}

      {hasBenefits && (
        <DetailAccordion title="Benefits" icon={Gift} defaultOpen>
          <SchemeBenefits items={details.benefits} />
        </DetailAccordion>
      )}

      {hasEligibility && (
        <DetailAccordion title="Eligibility" icon={CheckCircle}>
          <SchemeEligibility items={details.eligibility} />
        </DetailAccordion>
      )}

      {hasDocuments && (
        <DetailAccordion title="Required Documents" icon={ListChecks}>
          <SchemeDocuments items={details.documents} />
        </DetailAccordion>
      )}

      {hasSteps && (
        <DetailAccordion title="How to Apply" icon={ListOrdered}>
          <ol className="space-y-3">
            {details.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 text-xs font-bold text-green-700 dark:text-green-300">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </DetailAccordion>
      )}

      {hasNotes && (
        <DetailAccordion title="Important Notes" icon={AlertCircle}>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">{details.notes}</p>
          </div>
        </DetailAccordion>
      )}
    </div>
  );
}
