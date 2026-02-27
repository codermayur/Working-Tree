import React from 'react';
import { Briefcase, Wrench, Beef } from 'lucide-react';

export default function OpportunityTypeIcon({ type, className = 'w-4 h-4' }) {
  if (type === 'equipment') return <Wrench className={className} />;
  if (type === 'cattle') return <Beef className={className} />;
  return <Briefcase className={className} />;
}

