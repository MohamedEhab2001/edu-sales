export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "potential",
  "call_booked",
  "joined",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const CLIENT_INTEREST_LEVELS = ["unrated", "cold", "warm", "hot"] as const;
export type ClientInterestLevel = (typeof CLIENT_INTEREST_LEVELS)[number];
export type CallStatus = "scheduled" | "completed" | "cancelled";
export type OptionType = "field" | "salesperson" | "response";

export interface FollowUp {
  _id: string;
  scheduledAt?: string;
  completedAt?: string;
  response: string;
  notes?: string;
  outcome?: LeadStatus;
  interestLevel?: ClientInterestLevel;
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
  interestLevel: ClientInterestLevel;
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
  potentialLeads: number;
  joinedLeads: number;
  conversionRate: number;
  overdueFollowUps: number;
  callsToday: number;
  upcomingCalls: number;
  statusBreakdown: Array<{ label: LeadStatus; count: number }>;
  fieldBreakdown: Array<{ label: string; count: number }>;
  salespersonBreakdown: Array<{ label: string; count: number; joined: number }>;
}
