export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "call_booked",
  "joined",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type CallStatus = "scheduled" | "completed" | "cancelled";
export type OptionType = "field" | "salesperson" | "response";

export interface FollowUp {
  _id: string;
  scheduledAt?: string;
  completedAt?: string;
  response: string;
  notes?: string;
  outcome?: LeadStatus;
  assignedSalesperson?: string;
  nextFollowUpAt?: string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  name: string;
  field: string;
  phone: string;
  phoneNormalized: string;
  socialMedia?: string;
  bookedDate?: string;
  joined: boolean;
  status: LeadStatus;
  assignedSalesperson: string;
  finalNotes?: string;
  lastFollowUpAt?: string;
  nextFollowUpAt?: string;
  followUps: FollowUp[];
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledCall {
  _id: string;
  scheduledAt: string;
  contactName: string;
  field: string;
  phone: string;
  socialMedia?: string;
  assignedSalesperson: string;
  status: CallStatus;
  notes?: string;
  completedAt?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedOption {
  _id: string;
  type: OptionType;
  value: string;
  active: boolean;
  usageCount: number;
}

export interface Analytics {
  totalLeads: number;
  joinedLeads: number;
  conversionRate: number;
  overdueFollowUps: number;
  callsToday: number;
  upcomingCalls: number;
  statusBreakdown: Array<{ label: LeadStatus; count: number }>;
  fieldBreakdown: Array<{ label: string; count: number }>;
  salespersonBreakdown: Array<{ label: string; count: number; joined: number }>;
}
