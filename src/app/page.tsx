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

export default function Page() {
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
  } = useWorkflow();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">SEO Decision Engine</h1>
          <p className="text-muted-foreground">La IA sugiere. Tú decides.</p>
        </header>

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
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="h-8 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="h-8 border-red-200 text-red-700 hover:bg-red-100"
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
          />
        )}
      </div>

      <ConfirmBackDialog
        open={showBackDialog}
        onOpenChange={setShowBackDialog}
        onConfirm={confirmBack}
        description={backDialogMessage}
      />
    </main>
  );
}
