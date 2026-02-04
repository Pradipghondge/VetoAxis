"use client";

import React from 'react';
import { 
  Clock, XCircle, CheckCircle, DollarSign, AlertTriangle, 
  Copy, PhoneOff, ShieldAlert, TimerOff, FastForward, 
  PhoneCall, Clock1, Clock2, Clock3, Clock4, CreditCard, 
  FileQuestion, ArrowUpRight, Search, BadgeCheck, Zap, 
  FileText, Timer 
} from 'lucide-react';

// Centralized status configuration for the entire CRM
export const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; description: string }
> = {
  PENDING: {
    icon: <Clock />,
    color: '#facc15', // amber – waiting
    description: 'Awaiting initial system review',
  },

  REJECTED: {
    icon: <XCircle />,
    color: '#dc2626', // strong red – failure
    description: 'Disqualified lead parameters',
  },

  VERIFIED: {
    icon: <CheckCircle />,
    color: '#22c55e', // green – success
    description: 'Data points fully validated',
  },

  REJECTED_BY_CLIENT: {
    icon: <AlertTriangle />,
    color: '#fb7185', // rose – external rejection
    description: 'External client rejection',
  },

  PAID: {
    icon: <DollarSign />,
    color: '#16a34a', // money green
    description: 'Revenue transaction complete',
  },

  DUPLICATE: {
    icon: <Copy />,
    color: '#a78bfa', // violet – duplicate/reference
    description: 'Redundant entry detected',
  },

  NOT_RESPONDING: {
    icon: <PhoneOff />,
    color: '#64748b', // slate – inactive
    description: 'Communication attempts failed',
  },

  FELONY: {
    icon: <ShieldAlert />,
    color: '#7f1d1d', // dark red – legal risk
    description: 'Legal eligibility restriction',
  },

  DEAD_LEAD: {
    icon: <TimerOff />,
    color: '#1f2937', // charcoal – closed
    description: 'Lead non-conversion state',
  },

  WORKING: {
    icon: <FastForward />,
    color: '#2563eb', // blue – in progress
    description: 'Active pipeline progression',
  },

  CALL_BACK: {
    icon: <PhoneCall />,
    color: '#0ea5e9', // sky blue – follow up
    description: 'Scheduled follow-up sequence',
  },

  ATTEMPT_1: {
    icon: <Clock1 />,
    color: '#c7d2fe', // light indigo – early
    description: 'Initial outreach attempt',
  },

  ATTEMPT_2: {
    icon: <Clock2 />,
    color: '#818cf8', // medium indigo
    description: 'Secondary contact phase',
  },

  ATTEMPT_3: {
    icon: <Clock3 />,
    color: '#6366f1', // deeper indigo
    description: 'Tertiary contact phase',
  },

  ATTEMPT_4: {
    icon: <Clock4 />,
    color: '#4338ca', // darkest indigo – final
    description: 'Final outreach protocol',
  },

  CHARGEBACK: {
    icon: <CreditCard />,
    color: '#be185d', // magenta – financial alert
    description: 'Financial reversal alert',
  },

  WAITING_ID: {
    icon: <FileQuestion />,
    color: '#eab308', // yellow – pending docs
    description: 'Pending identity documents',
  },

  SENT_CLIENT: {
    icon: <ArrowUpRight />,
    color: '#059669', // emerald – sent forward
    description: 'Transferred to client portal',
  },

  QC: {
    icon: <Search />,
    color: '#9333ea', // purple – review
    description: 'Quality assurance evaluation',
  },

  ID_VERIFIED: {
    icon: <BadgeCheck />,
    color: '#15803d', // dark green – confirmed
    description: 'Confirmed identity status',
  },

  BILLABLE: {
    icon: <Zap />,
    color: '#14b8a6', // teal – ready to bill
    description: 'Validated for invoicing',
  },

  CAMPAIGN_PAUSED: {
    icon: <Timer />,
    color: '#94a3b8', // gray-blue – paused
    description: 'Active campaign on hold',
  },

  SENT_TO_LAW_FIRM: {
    icon: <FileText />,
    color: '#7c2d12', // brown – legal handoff
    description: 'Transferred to legal council',
  },
};


// Logical buckets for high-level metrics
export const BUCKETS = {
  PIPELINE: ["WORKING", "QC", "ATTEMPT_1", "ATTEMPT_2", "ATTEMPT_3", "ATTEMPT_4", "CALL_BACK"],
  CONVERSION: ["VERIFIED", "ID_VERIFIED", "SENT_CLIENT", "PAID", "BILLABLE", "SENT_TO_LAW_FIRM"],
  RISK: ["REJECTED", "REJECTED_BY_CLIENT", "DUPLICATE", "NOT_RESPONDING", "FELONY", "DEAD_LEAD", "CHARGEBACK"]
};