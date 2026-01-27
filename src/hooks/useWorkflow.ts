'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  IntentAnalysis,
  TemplateProposal,
  ContentDraft,
  OpportunityGuardOutput,
  TemplateGuardOutput,
  ContentGuardOutput,
} from '@/types/schemas';
import type { WorkflowStep, BusinessType } from '@/components/workflow';

// Timeout for API calls (35s - slightly longer than backend's 30s)
const API_TIMEOUT_MS = 35000;

class FetchTimeoutError extends Error {
  constructor() {
    super('La solicitud tardó demasiado. Por favor, inténtalo de nuevo.');
    this.name = 'FetchTimeoutError';
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new FetchTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

type BackTarget = 'input' | 'gate_a' | 'gate_b' | null;

export interface UseWorkflowReturn {
  // Current step
  step: WorkflowStep;
  
  // Input state
  keyword: string;
  setKeyword: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  businessType: BusinessType;
  setBusinessType: (value: BusinessType) => void;
  
  // Loading and error state
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  isRegenerating: boolean;
  
  // Gate A state
  intentAnalysis: IntentAnalysis | null;
  selectedOpportunityIndex: number | null;
  setSelectedOpportunityIndex: (index: number | null) => void;
  guardResult: OpportunityGuardOutput | null;
  setGuardResult: (result: OpportunityGuardOutput | null) => void;
  
  // Gate B state
  templateProposal: TemplateProposal | null;
  selectedTemplateIndex: number | null;
  setSelectedTemplateIndex: (index: number | null) => void;
  guardTemplateResult: TemplateGuardOutput | null;
  setGuardTemplateResult: (result: TemplateGuardOutput | null) => void;
  
  // Result state
  contentDraft: ContentDraft | null;
  guardContentResult: ContentGuardOutput | null;
  
  // Success message
  successMessage: string | null;
  
  // Back navigation
  showBackDialog: boolean;
  setShowBackDialog: (show: boolean) => void;
  backDialogMessage: string;
  
  // Actions
  handleAnalyzeIntent: () => Promise<void>;
  handleApproveOpportunity: () => Promise<void>;
  handleApproveTemplate: () => Promise<void>;
  handleRegenerate: () => Promise<void>;
  handleReset: () => void;
  handleRetry: () => void;
  handleBackFromGateA: () => void;
  handleBackFromGateB: () => void;
  handleBackFromResult: () => void;
  confirmBack: () => void;
}

export function useWorkflow(): UseWorkflowReturn {
  // Step state
  const [step, setStep] = useState<WorkflowStep>('input');
  
  // Input state
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('');
  
  // Loading and error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Gate A state
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const [selectedOpportunityIndex, setSelectedOpportunityIndex] = useState<number | null>(null);
  const [guardResult, setGuardResult] = useState<OpportunityGuardOutput | null>(null);
  
  // Gate B state
  const [templateProposal, setTemplateProposal] = useState<TemplateProposal | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [guardTemplateResult, setGuardTemplateResult] = useState<TemplateGuardOutput | null>(null);
  
  // Result state
  const [contentDraft, setContentDraft] = useState<ContentDraft | null>(null);
  const [guardContentResult, setGuardContentResult] = useState<ContentGuardOutput | null>(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Back navigation state
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [backTarget, setBackTarget] = useState<BackTarget>(null);
  const [backDialogMessage, setBackDialogMessage] = useState('');
  
  // Auto-hide success message after 2 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Wrapped setters that clear guard results
  const handleOpportunityIndexChange = useCallback((index: number | null) => {
    setSelectedOpportunityIndex(index);
    setGuardContentResult(null);
  }, []);
  
  const handleTemplateIndexChange = useCallback((index: number | null) => {
    setSelectedTemplateIndex(index);
    setGuardContentResult(null);
  }, []);
  
  // Action handlers
  const handleAnalyzeIntent = useCallback(async () => {
    if (!keyword.trim()) {
      setError('La palabra clave es requerida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithTimeout('/api/analyze-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('El análisis de intención falló');
      }

      const data: IntentAnalysis = await res.json();
      setIntentAnalysis(data);
      setStep('gate_a');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [keyword, location, businessType]);

  const handleApproveOpportunity = useCallback(async () => {
    if (selectedOpportunityIndex === null || !intentAnalysis) {
      setError('Debes seleccionar una oportunidad');
      return;
    }

    setLoading(true);
    setError(null);
    setGuardResult(null);

    try {
      const selectedOpportunity = intentAnalysis.opportunities[selectedOpportunityIndex];

      const validationRes = await fetchWithTimeout('/api/approve-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          intent_analysis: intentAnalysis,
          selected_opportunity_index: selectedOpportunityIndex,
          selected_opportunity: selectedOpportunity,
        }),
      });

      if (!validationRes.ok) {
        const errorData = await validationRes.json().catch(() => ({}));
        setError(errorData.error || 'La validación de oportunidad falló');
        setLoading(false);
        return;
      }

      const validationData: OpportunityGuardOutput = await validationRes.json();
      setGuardResult(validationData);

      if (!validationData.approved) {
        setLoading(false);
        return;
      }

      const res = await fetchWithTimeout('/api/propose-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          selected_opportunity: selectedOpportunity,
          selected_opportunity_index: selectedOpportunityIndex,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'La propuesta de templates falló');
        setLoading(false);
        return;
      }

      const data: TemplateProposal = await res.json();
      setTemplateProposal(data);
      setSuccessMessage('✓ Oportunidad validada');
      setStep('gate_b');
      setSelectedTemplateIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [selectedOpportunityIndex, intentAnalysis, keyword, location, businessType]);

  const handleApproveTemplate = useCallback(async () => {
    if (selectedTemplateIndex === null || !templateProposal || selectedOpportunityIndex === null || !intentAnalysis) {
      setError('Debes seleccionar un template');
      return;
    }

    setLoading(true);
    setError(null);
    setGuardTemplateResult(null);
    setGuardContentResult(null);

    try {
      const selectedTemplate = templateProposal.templates[selectedTemplateIndex];
      const selectedOpportunity = intentAnalysis.opportunities[selectedOpportunityIndex];

      const validationRes = await fetchWithTimeout('/api/approve-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          opportunity: selectedOpportunity,
          selected_template_index: selectedTemplateIndex,
          template: {
            name: selectedTemplate.name,
            description: selectedTemplate.rationale,
            structure: selectedTemplate.sections.map((s) => s.heading_text),
          },
        }),
      });

      if (!validationRes.ok) {
        const errorData = await validationRes.json().catch(() => ({}));
        setError(errorData.error || 'La validación del template falló');
        setLoading(false);
        return;
      }

      const validationData: TemplateGuardOutput = await validationRes.json();
      setGuardTemplateResult(validationData);

      if (!validationData.approved) {
        setLoading(false);
        return;
      }

      const res = await fetchWithTimeout('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          selected_template: selectedTemplate,
          selected_template_index: selectedTemplateIndex,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'La generación de contenido falló');
        setLoading(false);
        return;
      }

      const data: ContentDraft = await res.json();
      setContentDraft(data);

      const contentValidationRes = await fetchWithTimeout('/api/approve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          opportunity: selectedOpportunity,
          template: selectedTemplate,
          content: data,
        }),
      });

      if (!contentValidationRes.ok) {
        const errorData = await contentValidationRes.json().catch(() => ({}));
        setError(errorData.error || 'La validación del contenido falló');
        setLoading(false);
        return;
      }

      const contentValidationData: ContentGuardOutput = await contentValidationRes.json();
      setGuardContentResult(contentValidationData);

      setSuccessMessage('✓ Estructura validada');
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [selectedTemplateIndex, templateProposal, selectedOpportunityIndex, intentAnalysis, keyword, location, businessType]);

  const handleRegenerate = useCallback(async () => {
    if (selectedTemplateIndex === null || !templateProposal || selectedOpportunityIndex === null || !intentAnalysis) {
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const selectedTemplate = templateProposal.templates[selectedTemplateIndex];
      const selectedOpportunity = intentAnalysis.opportunities[selectedOpportunityIndex];

      const res = await fetchWithTimeout('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          selected_template: selectedTemplate,
          selected_template_index: selectedTemplateIndex,
          improvement_hint: guardContentResult?.suggested_fix || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'La regeneración de contenido falló');
        setIsRegenerating(false);
        return;
      }

      const data: ContentDraft = await res.json();
      setContentDraft(data);

      const contentValidationRes = await fetchWithTimeout('/api/approve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
          business_type: businessType || undefined,
          opportunity: selectedOpportunity,
          template: selectedTemplate,
          content: data,
        }),
      });

      if (!contentValidationRes.ok) {
        const errorData = await contentValidationRes.json().catch(() => ({}));
        setError(errorData.error || 'La validación del contenido falló');
        setIsRegenerating(false);
        return;
      }

      const contentValidationData: ContentGuardOutput = await contentValidationRes.json();
      setGuardContentResult(contentValidationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsRegenerating(false);
    }
  }, [selectedTemplateIndex, templateProposal, selectedOpportunityIndex, intentAnalysis, keyword, location, businessType, guardContentResult?.suggested_fix]);

  const handleReset = useCallback(() => {
    setStep('input');
    setKeyword('');
    setLocation('');
    setBusinessType('');
    setIntentAnalysis(null);
    setSelectedOpportunityIndex(null);
    setGuardResult(null);
    setTemplateProposal(null);
    setSelectedTemplateIndex(null);
    setGuardTemplateResult(null);
    setContentDraft(null);
    setGuardContentResult(null);
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    switch (step) {
      case 'input':
        handleAnalyzeIntent();
        break;
      case 'gate_a':
        handleApproveOpportunity();
        break;
      case 'gate_b':
        handleApproveTemplate();
        break;
      case 'result':
        handleRegenerate();
        break;
    }
  }, [step, handleAnalyzeIntent, handleApproveOpportunity, handleApproveTemplate, handleRegenerate]);

  // Back navigation handlers
  const handleBackFromGateA = useCallback(() => {
    setStep('input');
    setSelectedOpportunityIndex(null);
    setGuardResult(null);
    setError(null);
  }, []);

  const handleBackFromGateB = useCallback(() => {
    setBackTarget('gate_a');
    setBackDialogMessage(
      'Si vuelves, perderás la propuesta de templates actual. Tu selección de oportunidad se mantendrá.'
    );
    setShowBackDialog(true);
  }, []);

  const handleBackFromResult = useCallback(() => {
    setBackTarget('gate_b');
    setBackDialogMessage(
      'Si vuelves, perderás el contenido generado. Podrás elegir otra estructura y generar nuevo contenido.'
    );
    setShowBackDialog(true);
  }, []);

  const confirmBack = useCallback(() => {
    if (backTarget === 'gate_a') {
      setStep('gate_a');
      setTemplateProposal(null);
      setSelectedTemplateIndex(null);
      setGuardTemplateResult(null);
      setError(null);
    } else if (backTarget === 'gate_b') {
      setStep('gate_b');
      setContentDraft(null);
      setGuardContentResult(null);
      setError(null);
    }
    setShowBackDialog(false);
    setBackTarget(null);
  }, [backTarget]);

  return {
    // Current step
    step,
    
    // Input state
    keyword,
    setKeyword,
    location,
    setLocation,
    businessType,
    setBusinessType,
    
    // Loading and error state
    loading,
    error,
    setError,
    isRegenerating,
    
    // Gate A state
    intentAnalysis,
    selectedOpportunityIndex,
    setSelectedOpportunityIndex: handleOpportunityIndexChange,
    guardResult,
    setGuardResult,
    
    // Gate B state
    templateProposal,
    selectedTemplateIndex,
    setSelectedTemplateIndex: handleTemplateIndexChange,
    guardTemplateResult,
    setGuardTemplateResult,
    
    // Result state
    contentDraft,
    guardContentResult,
    
    // Success message
    successMessage,
    
    // Back navigation
    showBackDialog,
    setShowBackDialog,
    backDialogMessage,
    
    // Actions
    handleAnalyzeIntent,
    handleApproveOpportunity,
    handleApproveTemplate,
    handleRegenerate,
    handleReset,
    handleRetry,
    handleBackFromGateA,
    handleBackFromGateB,
    handleBackFromResult,
    confirmBack,
  };
}
