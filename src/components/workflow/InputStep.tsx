'use client';

import { useState, useCallback } from 'react';
import { Info, CheckCircle2, ChevronDown, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LoadingOverlay } from './LoadingOverlay';
import { BUSINESS_TYPE_LABELS } from './types';
import type { InputStepProps } from './types';
import type { EntityProfile } from '@/types/schemas';

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

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

type PartialService = {
  name: string;
  description: string;
  price_range: string;
  custom_attributes: Record<string, string>;
};

type PartialHours = {
  day: typeof DAYS[number];
  open: string;
  close: string;
  closed: boolean;
};

type PartialEntityProfile = {
  business_name: string;
  business_type_detail: string;
  phone: string;
  email: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  service_area: string[];
  hours: PartialHours[];
  services: PartialService[];
  founding_year: string;
  certifications: string[];
  awards: string[];
  team_size: string;
  team_highlights: string[];
  review_count: string;
  average_rating: string;
  review_platforms: string[];
  coordinates: { latitude: string; longitude: string };
  custom_attributes: Record<string, string>;
};

function emptyProfile(): PartialEntityProfile {
  return {
    business_name: '',
    business_type_detail: '',
    phone: '',
    email: '',
    website: '',
    address: { street: '', city: '', state: '', postal_code: '', country: 'MX' },
    service_area: [''],
    hours: DAYS.map((day) => ({ day, open: '09:00', close: '18:00', closed: day === 'sunday' })),
    services: [{ name: '', description: '', price_range: '', custom_attributes: {} }],
    founding_year: '',
    certifications: [],
    awards: [],
    team_size: '',
    team_highlights: [],
    review_count: '',
    average_rating: '',
    review_platforms: [],
    coordinates: { latitude: '', longitude: '' },
    custom_attributes: {},
  };
}

function buildEntityProfile(partial: PartialEntityProfile): EntityProfile | null {
  // Minimum required fields
  if (!partial.business_name.trim() || !partial.phone.trim() || !partial.address.street.trim() || !partial.address.city.trim() || !partial.address.state.trim() || !partial.address.postal_code.trim()) {
    return null;
  }

  const validServices = partial.services.filter(
    (s) => s.name.trim() && s.description.trim() && s.description.length >= 10,
  );
  if (validServices.length === 0) return null;

  const validAreas = partial.service_area.filter((a) => a.trim());
  if (validAreas.length === 0) return null;

  const validHours = partial.hours.filter((h) => !h.closed);
  if (validHours.length === 0) return null;

  const profile: EntityProfile = {
    business_name: partial.business_name.trim(),
    address: {
      street: partial.address.street.trim(),
      city: partial.address.city.trim(),
      state: partial.address.state.trim(),
      postal_code: partial.address.postal_code.trim(),
      country: partial.address.country.trim() || 'MX',
    },
    phone: partial.phone.trim(),
    service_area: validAreas.map((a) => a.trim()),
    hours: partial.hours.map((h) => ({
      day: h.day,
      open: h.open,
      close: h.close,
      closed: h.closed,
    })),
    services: validServices.map((s) => {
      const svc: EntityProfile['services'][number] = {
        name: s.name.trim(),
        description: s.description.trim(),
      };
      if (s.price_range.trim()) svc.price_range = s.price_range.trim();
      const customAttrs = Object.fromEntries(
        Object.entries(s.custom_attributes).filter(([k, v]) => k.trim() && v.trim()),
      );
      if (Object.keys(customAttrs).length > 0) svc.custom_attributes = customAttrs;
      return svc;
    }),
  };

  if (partial.business_type_detail.trim()) profile.business_type_detail = partial.business_type_detail.trim();
  if (partial.email.trim()) profile.email = partial.email.trim();
  if (partial.website.trim()) profile.website = partial.website.trim();
  if (partial.founding_year.trim()) {
    const year = parseInt(partial.founding_year, 10);
    if (!isNaN(year) && year >= 1800 && year <= 2030) profile.founding_year = year;
  }
  if (partial.certifications.filter((c) => c.trim()).length > 0) {
    profile.certifications = partial.certifications.filter((c) => c.trim());
  }
  if (partial.awards.filter((a) => a.trim()).length > 0) {
    profile.awards = partial.awards.filter((a) => a.trim());
  }
  if (partial.team_size.trim()) profile.team_size = partial.team_size.trim();
  if (partial.team_highlights.filter((t) => t.trim()).length > 0) {
    profile.team_highlights = partial.team_highlights.filter((t) => t.trim());
  }
  if (partial.review_count.trim()) {
    const count = parseInt(partial.review_count, 10);
    if (!isNaN(count) && count >= 0) profile.review_count = count;
  }
  if (partial.average_rating.trim()) {
    const rating = parseFloat(partial.average_rating);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) profile.average_rating = rating;
  }
  if (partial.review_platforms.filter((p) => p.trim()).length > 0) {
    profile.review_platforms = partial.review_platforms.filter((p) => p.trim());
  }
  if (partial.coordinates.latitude.trim() && partial.coordinates.longitude.trim()) {
    const lat = parseFloat(partial.coordinates.latitude);
    const lng = parseFloat(partial.coordinates.longitude);
    if (!isNaN(lat) && !isNaN(lng)) profile.coordinates = { latitude: lat, longitude: lng };
  }

  const customAttrs = Object.fromEntries(
    Object.entries(partial.custom_attributes).filter(([k, v]) => k.trim() && v.trim()),
  );
  if (Object.keys(customAttrs).length > 0) profile.custom_attributes = customAttrs;

  return profile;
}

export function InputStep({
  keyword,
  setKeyword,
  location,
  setLocation,
  businessType,
  setBusinessType,
  entityProfile,
  setEntityProfile,
  loading,
  onAnalyze,
}: InputStepProps) {
  const [profileOpen, setProfileOpen] = useState(!!entityProfile);
  const [partial, setPartial] = useState<PartialEntityProfile>(emptyProfile);
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);

  // Sync partial to entityProfile when fields change
  const updatePartial = useCallback(
    (updater: (prev: PartialEntityProfile) => PartialEntityProfile) => {
      setPartial((prev) => {
        const next = updater(prev);
        const built = buildEntityProfile(next);
        setEntityProfile(built);
        return next;
      });
    },
    [setEntityProfile],
  );

  const handleJsonImport = useCallback(() => {
    const result = window.prompt('Pega el JSON del EntityProfile:');
    if (!result) return;

    try {
      const parsed = JSON.parse(result);
      // Try to populate partial from JSON
      const p = emptyProfile();
      if (parsed.business_name) p.business_name = parsed.business_name;
      if (parsed.business_type_detail) p.business_type_detail = parsed.business_type_detail;
      if (parsed.phone) p.phone = parsed.phone;
      if (parsed.email) p.email = parsed.email;
      if (parsed.website) p.website = parsed.website;
      if (parsed.address) {
        p.address = { ...p.address, ...parsed.address };
      }
      if (Array.isArray(parsed.service_area)) p.service_area = parsed.service_area;
      if (Array.isArray(parsed.hours)) {
        p.hours = parsed.hours.map((h: Record<string, unknown>) => ({
          day: String(h.day || 'monday'),
          open: String(h.open || '09:00'),
          close: String(h.close || '18:00'),
          closed: Boolean(h.closed),
        }));
      }
      if (Array.isArray(parsed.services)) {
        p.services = parsed.services.map((s: Record<string, unknown>) => ({
          name: String(s.name || ''),
          description: String(s.description || ''),
          price_range: String(s.price_range || ''),
          custom_attributes: (s.custom_attributes as Record<string, string>) || {},
        }));
      }
      if (parsed.founding_year) p.founding_year = String(parsed.founding_year);
      if (Array.isArray(parsed.certifications)) p.certifications = parsed.certifications;
      if (Array.isArray(parsed.awards)) p.awards = parsed.awards;
      if (parsed.team_size) p.team_size = parsed.team_size;
      if (Array.isArray(parsed.team_highlights)) p.team_highlights = parsed.team_highlights;
      if (parsed.review_count != null) p.review_count = String(parsed.review_count);
      if (parsed.average_rating != null) p.average_rating = String(parsed.average_rating);
      if (Array.isArray(parsed.review_platforms)) p.review_platforms = parsed.review_platforms;
      if (parsed.coordinates) {
        p.coordinates = {
          latitude: String(parsed.coordinates.latitude || ''),
          longitude: String(parsed.coordinates.longitude || ''),
        };
      }
      if (parsed.custom_attributes) p.custom_attributes = parsed.custom_attributes;

      setPartial(p);
      const built = buildEntityProfile(p);
      setEntityProfile(built);
      setJsonImportError(null);
      setProfileOpen(true);
    } catch {
      setJsonImportError('JSON inválido. Verifica el formato.');
    }
  }, [setEntityProfile]);

  // Custom attributes key-value management
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

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
              {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Profile — Collapsible */}
        <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between" disabled={loading}>
              <span className="flex items-center gap-2">
                {entityProfile ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600" />
                )}
                Perfil del Negocio {entityProfile ? '(configurado)' : '(opcional)'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-6">
            {/* Import JSON */}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleJsonImport} disabled={loading}>
                <Upload className="w-4 h-4 mr-1" />
                Importar JSON
              </Button>
              {jsonImportError && (
                <span className="text-xs text-red-600">{jsonImportError}</span>
              )}
              {entityProfile && (
                <span className="text-xs text-emerald-600">Perfil válido</span>
              )}
            </div>

            {/* 1. Info Básica */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Info Básica</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del negocio *</Label>
                  <Input
                    placeholder="ej: Kinder Montessori Rayitos"
                    value={partial.business_name}
                    onChange={(e) => updatePartial((p) => ({ ...p, business_name: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Detalle del tipo</Label>
                  <Input
                    placeholder="ej: Kinder Montessori bilingüe"
                    value={partial.business_type_detail}
                    onChange={(e) => updatePartial((p) => ({ ...p, business_type_detail: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono *</Label>
                  <Input
                    placeholder="+52-662-123-4567"
                    value={partial.phone}
                    onChange={(e) => updatePartial((p) => ({ ...p, phone: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    placeholder="info@negocio.com"
                    value={partial.email}
                    onChange={(e) => updatePartial((p) => ({ ...p, email: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Website</Label>
                  <Input
                    placeholder="https://..."
                    value={partial.website}
                    onChange={(e) => updatePartial((p) => ({ ...p, website: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>
            </fieldset>

            {/* 2. Dirección */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Dirección *</legend>
              <div className="space-y-1">
                <Label className="text-xs">Calle</Label>
                <Input
                  placeholder="Blvd. Solidaridad 1234"
                  value={partial.address.street}
                  onChange={(e) => updatePartial((p) => ({ ...p, address: { ...p.address, street: e.target.value } }))}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ciudad</Label>
                  <Input
                    placeholder="Hermosillo"
                    value={partial.address.city}
                    onChange={(e) => updatePartial((p) => ({ ...p, address: { ...p.address, city: e.target.value } }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Estado</Label>
                  <Input
                    placeholder="Sonora"
                    value={partial.address.state}
                    onChange={(e) => updatePartial((p) => ({ ...p, address: { ...p.address, state: e.target.value } }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">C.P.</Label>
                  <Input
                    placeholder="83140"
                    value={partial.address.postal_code}
                    onChange={(e) => updatePartial((p) => ({ ...p, address: { ...p.address, postal_code: e.target.value } }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">País</Label>
                  <Input
                    placeholder="MX"
                    value={partial.address.country}
                    onChange={(e) => updatePartial((p) => ({ ...p, address: { ...p.address, country: e.target.value } }))}
                    disabled={loading}
                  />
                </div>
              </div>
            </fieldset>

            {/* 3. Servicios */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Servicios *</legend>
              {partial.services.map((service, idx) => (
                <div key={idx} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Servicio {idx + 1}</span>
                    {partial.services.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                        aria-label={`Eliminar servicio ${idx + 1}`}
                        onClick={() => updatePartial((p) => ({
                          ...p,
                          services: p.services.filter((_, i) => i !== idx),
                        }))}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Nombre *"
                      value={service.name}
                      onChange={(e) => updatePartial((p) => ({
                        ...p,
                        services: p.services.map((s, i) => i === idx ? { ...s, name: e.target.value } : s),
                      }))}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Precio (ej: $3,500/mes)"
                      value={service.price_range}
                      onChange={(e) => updatePartial((p) => ({
                        ...p,
                        services: p.services.map((s, i) => i === idx ? { ...s, price_range: e.target.value } : s),
                      }))}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Descripción (10+ chars) *"
                      value={service.description}
                      onChange={(e) => updatePartial((p) => ({
                        ...p,
                        services: p.services.map((s, i) => i === idx ? { ...s, description: e.target.value } : s),
                      }))}
                      disabled={loading}
                    />
                  </div>
                  {/* Service custom attributes */}
                  {Object.entries(service.custom_attributes).map(([k, v]) => (
                    <div key={k} className="flex gap-2 items-center">
                      <span className="text-xs text-muted-foreground w-24 truncate">{k}:</span>
                      <Input
                        className="h-7 text-xs"
                        value={v}
                        onChange={(e) => updatePartial((p) => ({
                          ...p,
                          services: p.services.map((s, i) =>
                            i === idx ? { ...s, custom_attributes: { ...s.custom_attributes, [k]: e.target.value } } : s,
                          ),
                        }))}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                        aria-label={`Eliminar atributo ${k}`}
                        onClick={() => updatePartial((p) => ({
                          ...p,
                          services: p.services.map((s, i) => {
                            if (i !== idx) return s;
                            const { [k]: _omitted, ...rest } = s.custom_attributes;
                            return { ...s, custom_attributes: rest };
                          }),
                        }))}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const key = window.prompt('Nombre del atributo (ej: age_range, cuisine, specialty):');
                      if (!key?.trim()) return;
                      updatePartial((p) => ({
                        ...p,
                        services: p.services.map((s, i) =>
                          i === idx ? { ...s, custom_attributes: { ...s.custom_attributes, [key.trim()]: '' } } : s,
                        ),
                      }));
                    }}
                    disabled={loading}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Atributo
                  </Button>
                </div>
              ))}
              {partial.services.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updatePartial((p) => ({
                    ...p,
                    services: [...p.services, { name: '', description: '', price_range: '', custom_attributes: {} }],
                  }))}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar servicio
                </Button>
              )}
            </fieldset>

            {/* 4. Horarios */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Horarios *</legend>
              <div className="space-y-2">
                {partial.hours.map((h, idx) => (
                  <div key={h.day} className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <label className="flex items-center gap-2 w-28">
                      <input
                        type="checkbox"
                        checked={!h.closed}
                        onChange={(e) => updatePartial((p) => ({
                          ...p,
                          hours: p.hours.map((hr, i) => i === idx ? { ...hr, closed: !e.target.checked } : hr),
                        }))}
                        disabled={loading}
                        className="rounded"
                      />
                      <span className="text-sm">{DAY_LABELS[h.day]}</span>
                    </label>
                    {!h.closed && (
                      <>
                        <Input
                          type="time"
                          className="w-full sm:w-28 h-9"
                          value={h.open}
                          onChange={(e) => updatePartial((p) => ({
                            ...p,
                            hours: p.hours.map((hr, i) => i === idx ? { ...hr, open: e.target.value } : hr),
                          }))}
                          disabled={loading}
                        />
                        <span className="text-xs text-muted-foreground">a</span>
                        <Input
                          type="time"
                          className="w-full sm:w-28 h-9"
                          value={h.close}
                          onChange={(e) => updatePartial((p) => ({
                            ...p,
                            hours: p.hours.map((hr, i) => i === idx ? { ...hr, close: e.target.value } : hr),
                          }))}
                          disabled={loading}
                        />
                      </>
                    )}
                    {h.closed && <span className="text-xs text-muted-foreground">Cerrado</span>}
                  </div>
                ))}
              </div>
            </fieldset>

            {/* 5. Confianza (E-E-A-T) */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Confianza (opcional)</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Año de fundación</Label>
                  <Input
                    type="number"
                    placeholder="2005"
                    value={partial.founding_year}
                    onChange={(e) => updatePartial((p) => ({ ...p, founding_year: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tamaño del equipo</Label>
                  <Input
                    placeholder="ej: 15 educadoras"
                    value={partial.team_size}
                    onChange={(e) => updatePartial((p) => ({ ...p, team_size: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Certificaciones (separadas por coma)</Label>
                <Input
                  placeholder="SEP, AMI Montessori, ISO 9001"
                  value={partial.certifications.join(', ')}
                  onChange={(e) => updatePartial((p) => ({
                    ...p,
                    certifications: e.target.value.split(',').map((c) => c.trim()).filter(Boolean),
                  }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Premios (separados por coma)</Label>
                <Input
                  placeholder="Mejor kinder 2023, Premio a la excelencia"
                  value={partial.awards.join(', ')}
                  onChange={(e) => updatePartial((p) => ({
                    ...p,
                    awards: e.target.value.split(',').map((a) => a.trim()).filter(Boolean),
                  }))}
                  disabled={loading}
                />
              </div>
            </fieldset>

            {/* 6. Reviews */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Reviews (opcional)</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cantidad de reseñas</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={partial.review_count}
                    onChange={(e) => updatePartial((p) => ({ ...p, review_count: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rating promedio (1-5)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    placeholder="4.8"
                    value={partial.average_rating}
                    onChange={(e) => updatePartial((p) => ({ ...p, average_rating: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Plataformas</Label>
                  <Input
                    placeholder="Google, Yelp"
                    value={partial.review_platforms.join(', ')}
                    onChange={(e) => updatePartial((p) => ({
                      ...p,
                      review_platforms: e.target.value.split(',').map((r) => r.trim()).filter(Boolean),
                    }))}
                    disabled={loading}
                  />
                </div>
              </div>
            </fieldset>

            {/* 7. Ubicación */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Ubicación</legend>
              <div className="space-y-1">
                <Label className="text-xs">Áreas de servicio * (separadas por coma)</Label>
                <Input
                  placeholder="Zona Poniente, Hermosillo"
                  value={partial.service_area.join(', ')}
                  onChange={(e) => updatePartial((p) => ({
                    ...p,
                    service_area: e.target.value.split(',').map((a) => a.trim()).filter(Boolean),
                  }))}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Latitud</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="29.0729"
                    value={partial.coordinates.latitude}
                    onChange={(e) => updatePartial((p) => ({
                      ...p,
                      coordinates: { ...p.coordinates, latitude: e.target.value },
                    }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longitud</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-110.9559"
                    value={partial.coordinates.longitude}
                    onChange={(e) => updatePartial((p) => ({
                      ...p,
                      coordinates: { ...p.coordinates, longitude: e.target.value },
                    }))}
                    disabled={loading}
                  />
                </div>
              </div>
            </fieldset>

            {/* 8. Custom Attributes */}
            <fieldset className="space-y-3 border border-border rounded-lg p-4">
              <legend className="text-sm font-medium px-2">Atributos adicionales</legend>
              <p className="text-xs text-muted-foreground">
                Datos específicos de tu vertical (ej: parking, delivery, methodology, capacity).
              </p>
              {Object.entries(partial.custom_attributes).map(([k, v]) => (
                <div key={k} className="flex gap-2 items-center">
                  <span className="text-sm w-32 truncate font-medium">{k}</span>
                  <Input
                    value={v}
                    onChange={(e) => updatePartial((p) => ({
                      ...p,
                      custom_attributes: { ...p.custom_attributes, [k]: e.target.value },
                    }))}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
                    aria-label={`Eliminar atributo ${k}`}
                    onClick={() => updatePartial((p) => {
                      const { [k]: _omitted, ...rest } = p.custom_attributes;
                      return { ...p, custom_attributes: rest };
                    })}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Clave"
                  value={newAttrKey}
                  onChange={(e) => setNewAttrKey(e.target.value)}
                  className="w-32"
                  disabled={loading}
                />
                <Input
                  placeholder="Valor"
                  value={newAttrValue}
                  onChange={(e) => setNewAttrValue(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newAttrKey.trim() && newAttrValue.trim()) {
                      updatePartial((p) => ({
                        ...p,
                        custom_attributes: { ...p.custom_attributes, [newAttrKey.trim()]: newAttrValue.trim() },
                      }));
                      setNewAttrKey('');
                      setNewAttrValue('');
                    }
                  }}
                  disabled={loading || !newAttrKey.trim() || !newAttrValue.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </fieldset>
          </CollapsibleContent>
        </Collapsible>

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
