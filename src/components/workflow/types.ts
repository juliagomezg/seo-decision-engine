import type {
  IntentAnalysis,
  TemplateProposal,
  ContentDraft,
  OpportunityGuardOutput,
  TemplateGuardOutput,
  ContentGuardOutput,
} from '@/types/schemas';

export type WorkflowStep = 'input' | 'gate_a' | 'gate_b' | 'result';

export type BusinessType = '' | 'real_estate' | 'hospitality' | 'saas' | 'local_services';

export interface InputStepProps {
  keyword: string;
  setKeyword: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  businessType: BusinessType;
  setBusinessType: (value: BusinessType) => void;
  loading: boolean;
  onAnalyze: () => void;
}

export interface GateAStepProps {
  intentAnalysis: IntentAnalysis;
  selectedOpportunityIndex: number | null;
  setSelectedOpportunityIndex: (index: number | null) => void;
  guardResult: OpportunityGuardOutput | null;
  setGuardResult: (result: OpportunityGuardOutput | null) => void;
  loading: boolean;
  onApprove: () => void;
}

export interface GateBStepProps {
  templateProposal: TemplateProposal;
  selectedTemplateIndex: number | null;
  setSelectedTemplateIndex: (index: number | null) => void;
  guardTemplateResult: TemplateGuardOutput | null;
  setGuardTemplateResult: (result: TemplateGuardOutput | null) => void;
  keyword: string;
  businessType: BusinessType;
  intentAnalysis: IntentAnalysis | null;
  loading: boolean;
  onApprove: () => void;
}

export interface ResultStepProps {
  contentDraft: ContentDraft;
  guardContentResult: ContentGuardOutput | null;
  keyword: string;
  businessType: BusinessType;
  intentAnalysis: IntentAnalysis | null;
  selectedOpportunityIndex: number | null;
  templateProposal: TemplateProposal | null;
  selectedTemplateIndex: number | null;
  onReset: () => void;
}

export interface BusinessContextBarProps {
  keyword: string;
  businessType: BusinessType;
  intentAnalysis: IntentAnalysis | null;
}

export interface ValidationFeedbackProps {
  title: string;
  description: string;
  reasons: string[];
  riskFlags: string[];
  suggestedFix?: string;
  variant: 'error' | 'warning';
}

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  real_estate: 'Real Estate',
  hospitality: 'Hospitality',
  saas: 'SaaS',
  local_services: 'Local Services',
};

export const INTENT_LABELS: Record<string, string> = {
  commercial: 'Commercial',
  informational: 'Informational',
  navigational: 'Navigational',
  transactional: 'Transactional',
};
