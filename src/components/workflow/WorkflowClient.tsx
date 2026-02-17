'use client';

import { AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/step-indicator';
import {
  InputStep,
  GateAStep,
  GateBStep,
  ResultStep,
  ConfirmBackDialog,
} from '@/components/workflow';
import { useWorkflow } from '@/hooks/useWorkflow';

export function WorkflowClient() {
  const {
    step,
    keyword,
    setKeyword,
    location,
    setLocation,
    businessType,
    setBusinessType,
    entityProfile,
    setEntityProfile,
    loading,
    error,
    setError,
    isRegenerating,
    intentAnalysis,
    selectedOpportunityIndex,
    setSelectedOpportunityIndex,
    guardResult,
    setGuardResult,
    templateProposal,
    selectedTemplateIndex,
    setSelectedTemplateIndex,
    guardTemplateResult,
    setGuardTemplateResult,
    contentDraft,
    guardContentResult,
    jsonldOutput,
    successMessage,
    showBackDialog,
    setShowBackDialog,
    backDialogMessage,
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
    handlePublish,
    publishedUrl,
  } = useWorkflow();

  return (
    <>
      <StepIndicator currentStep={step} />

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Algo no salió como esperábamos</p>
                <p className="text-sm mt-1">{error}</p>
                <p className="text-xs mt-2 text-red-600">
                  Tu progreso anterior está guardado. Puedes reintentar o continuar desde donde estabas.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="min-h-[44px] min-w-[44px] border-red-200 text-red-700 hover:bg-red-100"
                aria-label="Cerrar mensaje de error"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="min-h-[44px] border-red-200 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'input' && (
        <InputStep
          keyword={keyword}
          setKeyword={setKeyword}
          location={location}
          setLocation={setLocation}
          businessType={businessType}
          setBusinessType={setBusinessType}
          entityProfile={entityProfile}
          setEntityProfile={setEntityProfile}
          loading={loading}
          onAnalyze={handleAnalyzeIntent}
        />
      )}

      {step === 'gate_a' && intentAnalysis && (
        <GateAStep
          intentAnalysis={intentAnalysis}
          selectedOpportunityIndex={selectedOpportunityIndex}
          setSelectedOpportunityIndex={setSelectedOpportunityIndex}
          guardResult={guardResult}
          setGuardResult={setGuardResult}
          loading={loading}
          onApprove={handleApproveOpportunity}
          onBack={handleBackFromGateA}
        />
      )}

      {step === 'gate_b' && templateProposal && (
        <GateBStep
          templateProposal={templateProposal}
          selectedTemplateIndex={selectedTemplateIndex}
          setSelectedTemplateIndex={setSelectedTemplateIndex}
          guardTemplateResult={guardTemplateResult}
          setGuardTemplateResult={setGuardTemplateResult}
          keyword={keyword}
          businessType={businessType}
          intentAnalysis={intentAnalysis}
          loading={loading}
          onApprove={handleApproveTemplate}
          onBack={handleBackFromGateB}
        />
      )}

      {step === 'result' && contentDraft && (
        <ResultStep
          contentDraft={contentDraft}
          guardContentResult={guardContentResult}
          keyword={keyword}
          businessType={businessType}
          intentAnalysis={intentAnalysis}
          selectedOpportunityIndex={selectedOpportunityIndex}
          templateProposal={templateProposal}
          selectedTemplateIndex={selectedTemplateIndex}
          entityProfile={entityProfile}
          jsonldOutput={jsonldOutput}
          onReset={handleReset}
          onBack={handleBackFromResult}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          onPublish={handlePublish}
          publishedUrl={publishedUrl}
        />
      )}

      <ConfirmBackDialog
        open={showBackDialog}
        onOpenChange={setShowBackDialog}
        onConfirm={confirmBack}
        description={backDialogMessage}
      />
    </>
  );
}
