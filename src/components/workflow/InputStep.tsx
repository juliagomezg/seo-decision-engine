'use client';

import { Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingOverlay } from './LoadingOverlay';
import type { InputStepProps } from './types';

const ANALYSIS_CRITERIA_DETAILED = [
  {
    title: 'Clasificar intención',
    description: 'Determinar si buscan información, comprar, comparar o navegar.',
  },
  {
    title: 'Identificar oportunidades',
    description: 'Encontrar ángulos únicos que no estén saturados.',
  },
  {
    title: 'Evaluar viabilidad',
    description: 'Verificar que el contenido sea relevante para tu negocio.',
  },
];

const LOADING_STEPS = [
  'Analizando keyword...',
  'Clasificando intención de búsqueda...',
  'Identificando oportunidades...',
  'Evaluando viabilidad...',
];

const LOADING_TIPS = [
  'Una keyword con intención clara genera mejor contenido.',
  'El tipo de negocio ayuda a personalizar las oportunidades.',
  'La ubicación permite detectar oportunidades locales.',
];

export function InputStep({
  keyword,
  setKeyword,
  location,
  setLocation,
  businessType,
  setBusinessType,
  loading,
  onAnalyze,
}: InputStepProps) {
  return (
    <>
      {loading && (
        <LoadingOverlay
          steps={LOADING_STEPS}
          tips={LOADING_TIPS}
        />
      )}
      <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Análisis de intención</CardTitle>
        <CardDescription>
          Ingresa tu keyword objetivo para analizar la intención de búsqueda y descubrir oportunidades.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="keyword">Keyword *</Label>
          <Input
            id="keyword"
            placeholder="ej: best CRM software"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación (opcional)</Label>
          <Input
            id="location"
            placeholder="ej: United States, New York, etc."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-type">Tipo de negocio (opcional)</Label>
          <Select
            value={businessType}
            onValueChange={(value) => setBusinessType(value as typeof businessType)}
            disabled={loading}
          >
            <SelectTrigger id="business-type" className="w-full">
              <SelectValue placeholder="Selecciona tipo de negocio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="hospitality">Hospitality</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="local_services">Local Services</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Criterios expandidos con descripciones */}
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Qué hará el análisis</p>
          </div>
          <div className="space-y-2">
            {ANALYSIS_CRITERIA_DETAILED.map((criterion, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-blue-900">{criterion.title}: </span>
                  <span className="text-sm text-blue-700">{criterion.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={onAnalyze} disabled={!keyword.trim() || loading}>
          Analizar intención
        </Button>
      </CardContent>
    </Card>
    </>
  );
}
