import { describe, it, expect } from 'vitest';
import {
  buildFAQPageJsonLd,
  buildLocalBusinessJsonLd,
  buildServiceJsonLd,
  buildBreadcrumbJsonLd,
  buildPlaceJsonLd,
  buildAllJsonLd,
  renderJsonLdScripts,
} from '../jsonld';
import type { EntityProfile, EnhancedContentDraft, CitableAnswerUnit } from '@/types/schemas';

// ============================================
// TEST FIXTURES
// ============================================

const mockEntity: EntityProfile = {
  business_name: 'Kinder Montessori Rayitos',
  business_type_detail: 'Kinder Montessori bilingüe',
  address: {
    street: 'Blvd. Solidaridad 1234',
    city: 'Hermosillo',
    state: 'Sonora',
    postal_code: '83140',
    country: 'MX',
  },
  phone: '+52-662-123-4567',
  email: 'info@rayitos.edu.mx',
  website: 'https://rayitos.edu.mx',
  coordinates: { latitude: 29.0729, longitude: -110.9559 },
  service_area: ['Zona Poniente', 'Hermosillo'],
  hours: [
    { day: 'monday', open: '08:00', close: '15:00', closed: false },
    { day: 'tuesday', open: '08:00', close: '15:00', closed: false },
    { day: 'sunday', open: '00:00', close: '00:00', closed: true },
  ],
  services: [
    {
      name: 'Maternal',
      description: 'Programa para niños de 2-3 años con metodología Montessori',
      price_range: '$3,500/mes',
      custom_attributes: { age_range: '2-3 años', methodology: 'Montessori' },
    },
    {
      name: 'Preescolar',
      description: 'Programa SEP para niños de 4-6 años bilingüe',
      price_range: '$5,200/mes',
    },
  ],
  founding_year: 2005,
  certifications: ['SEP', 'AMI Montessori'],
  awards: ['Mejor kinder 2023'],
  team_size: '15 educadoras certificadas',
  review_count: 120,
  average_rating: 4.8,
  review_platforms: ['Google'],
  custom_attributes: { capacity: '120 niños', campus_size: '2,000 m²' },
};

const mockAnswerUnits: CitableAnswerUnit[] = [
  {
    question: '¿Cuánto cuesta un kinder Montessori en Hermosillo?',
    answer: 'El Kinder Montessori Rayitos en zona poniente de Hermosillo tiene colegiaturas desde $3,500 hasta $5,200 mensuales. El programa maternal (2-3 años) cuesta $3,500/mes y el preescolar (4-6 años) $5,200/mes.',
    answer_word_count: 42,
    topic_tag: 'pricing',
    evidence_type: 'factual',
    source_field: 'entity_profile.services[*].price_range',
  },
  {
    question: '¿Qué certificaciones tiene Kinder Rayitos?',
    answer: 'El Kinder Montessori Rayitos cuenta con certificación SEP y AMI Montessori. Fundado en 2005, tiene más de 15 educadoras certificadas y una calificación de 4.8/5 en Google con 120 reseñas verificadas.',
    answer_word_count: 40,
    topic_tag: 'certifications',
    evidence_type: 'factual',
    source_field: 'entity_profile.certifications',
  },
];

const mockEnhancedContent: EnhancedContentDraft = {
  title: 'Kinder Montessori en Hermosillo - Rayitos',
  slug: 'kinder-montessori-hermosillo-rayitos',
  h1: 'Kinder Montessori Rayitos en Hermosillo',
  meta_description: 'Kinder Montessori bilingüe en zona poniente de Hermosillo. Programas desde maternal hasta preescolar con certificación SEP y AMI.',
  sections: [
    {
      heading_level: 'h2',
      heading_text: 'Sobre Kinder Rayitos',
      content: 'Kinder Montessori Rayitos es un centro educativo en Hermosillo con más de 18 años de experiencia formando niños.',
      chunk_id: 'sobre-rayitos',
      is_self_contained: true,
      word_count: 20,
      topic_tags: ['about', 'education'],
    },
    {
      heading_level: 'h2',
      heading_text: 'Programas por Edad',
      content: 'Ofrecemos programas especializados para niños de 2 a 6 años con metodología Montessori y enfoque bilingüe.',
      chunk_id: 'programas-edad',
      is_self_contained: true,
      word_count: 18,
      topic_tags: ['programs', 'age-groups'],
    },
    {
      heading_level: 'h2',
      heading_text: 'Colegiaturas y Costos',
      content: 'El programa maternal para niños de 2-3 años tiene un costo de $3,500 mensuales. El programa preescolar cuesta $5,200/mes.',
      chunk_id: 'colegiaturas',
      is_self_contained: true,
      word_count: 22,
      topic_tags: ['pricing'],
    },
  ],
  faqs: [
    { question: '¿Cuánto cuesta?', answer: 'Las colegiaturas van de $3,500 a $5,200 mensuales.' },
    { question: '¿Qué edades aceptan?', answer: 'Aceptamos niños de 2 a 6 años.' },
    { question: '¿Tienen certificación?', answer: 'Sí, contamos con SEP y AMI Montessori.' },
  ],
  citable_answer_units: mockAnswerUnits,
  evidence_layer: {
    claims: [
      {
        claim_text: 'Colegiaturas desde $3,500 mensuales',
        claim_type: 'entity_fact',
        source: 'entity_profile.services[0].price_range',
        verifiable: true,
        section_index: 2,
      },
      {
        claim_text: 'Fundado en 2005',
        claim_type: 'entity_fact',
        source: 'entity_profile.founding_year',
        verifiable: true,
        section_index: 0,
      },
    ],
    total_claims: 2,
    verifiable_count: 2,
    verifiable_ratio: 1.0,
  },
  entity_card: {
    business_name: 'Kinder Montessori Rayitos',
    address_formatted: 'Blvd. Solidaridad 1234, Hermosillo, Sonora 83140',
    phone: '+52-662-123-4567',
    services_highlighted: ['Maternal', 'Preescolar'],
    hours_summary: 'Lun-Sáb 8:00-15:00',
    rating_summary: '4.8/5 (120 reseñas en Google)',
  },
  cta: { text: 'Agenda una visita', position: 'bottom' },
  metadata: {
    model: 'mixtral-8x7b-32768',
    prompt_version: 'v2.0.0',
    timestamp: '2026-01-15T12:00:00Z',
    word_count: 350,
  },
};

// ============================================
// TESTS: INDIVIDUAL BUILDERS
// ============================================

describe('buildFAQPageJsonLd', () => {
  it('generates valid FAQPage with all answer units', () => {
    const result = buildFAQPageJsonLd(mockAnswerUnits);

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('FAQPage');
    expect(result.mainEntity).toHaveLength(2);

    const first = (result.mainEntity as Array<Record<string, unknown>>)[0];
    expect(first['@type']).toBe('Question');
    expect(first.name).toBe(mockAnswerUnits[0].question);
    expect((first.acceptedAnswer as Record<string, unknown>)['@type']).toBe('Answer');
    expect((first.acceptedAnswer as Record<string, unknown>).text).toBe(mockAnswerUnits[0].answer);
  });

  it('handles empty answer units', () => {
    const result = buildFAQPageJsonLd([]);
    expect((result.mainEntity as unknown[]).length).toBe(0);
  });
});

describe('buildLocalBusinessJsonLd', () => {
  it('generates complete LocalBusiness with all fields', () => {
    const result = buildLocalBusinessJsonLd(mockEntity);

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('LocalBusiness');
    expect(result.name).toBe('Kinder Montessori Rayitos');
    expect(result.telephone).toBe('+52-662-123-4567');
    expect(result.email).toBe('info@rayitos.edu.mx');
    expect(result.url).toBe('https://rayitos.edu.mx');
    expect(result.foundingDate).toBe('2005');
  });

  it('includes GeoCoordinates when coordinates provided', () => {
    const result = buildLocalBusinessJsonLd(mockEntity);
    const geo = result.geo as Record<string, unknown>;

    expect(geo['@type']).toBe('GeoCoordinates');
    expect(geo.latitude).toBe(29.0729);
    expect(geo.longitude).toBe(-110.9559);
  });

  it('includes AggregateRating when review data available', () => {
    const result = buildLocalBusinessJsonLd(mockEntity);
    const rating = result.aggregateRating as Record<string, unknown>;

    expect(rating['@type']).toBe('AggregateRating');
    expect(rating.ratingValue).toBe(4.8);
    expect(rating.reviewCount).toBe(120);
  });

  it('includes opening hours specification', () => {
    const result = buildLocalBusinessJsonLd(mockEntity);
    const hours = result.openingHoursSpecification as Array<Record<string, unknown>>;

    // 2 open days (monday, tuesday), sunday is closed
    expect(hours).toHaveLength(2);
    expect(hours[0].dayOfWeek).toBe('Monday');
    expect(hours[0].opens).toBe('08:00');
    expect(hours[0].closes).toBe('15:00');
  });

  it('includes service area', () => {
    const result = buildLocalBusinessJsonLd(mockEntity);
    const areas = result.areaServed as Array<Record<string, unknown>>;

    expect(areas).toHaveLength(2);
    expect(areas[0].name).toBe('Zona Poniente');
  });

  it('includes custom_attributes as additionalProperty', () => {
    const result = buildLocalBusinessJsonLd(mockEntity);
    const props = result.additionalProperty as Array<Record<string, unknown>>;

    expect(props).toHaveLength(2);
    expect(props[0]['@type']).toBe('PropertyValue');
    expect(props[0].name).toBe('capacity');
    expect(props[0].value).toBe('120 niños');
  });

  it('uses custom schema type when provided', () => {
    const result = buildLocalBusinessJsonLd(mockEntity, 'EducationalOrganization');
    expect(result['@type']).toBe('EducationalOrganization');
  });

  it('handles entity without optional fields', () => {
    const minimal: EntityProfile = {
      business_name: 'Test Business',
      address: { street: 'St 1', city: 'City', state: 'State', postal_code: '12345', country: 'MX' },
      phone: '123456',
      service_area: ['City'],
      hours: [{ day: 'monday', open: '09:00', close: '17:00', closed: false }],
      services: [{ name: 'Service', description: 'A service description here' }],
    };

    const result = buildLocalBusinessJsonLd(minimal);
    expect(result.name).toBe('Test Business');
    expect(result.email).toBeUndefined();
    expect(result.url).toBeUndefined();
    expect(result.aggregateRating).toBeUndefined();
    expect(result.geo).toBeUndefined();
    expect(result.foundingDate).toBeUndefined();
    expect(result.additionalProperty).toBeUndefined();
  });
});

describe('buildServiceJsonLd', () => {
  it('generates Service schemas for all services', () => {
    const result = buildServiceJsonLd(mockEntity.services);

    expect(result).toHaveLength(2);
    expect(result[0]['@type']).toBe('Service');
    expect(result[0].name).toBe('Maternal');
    expect((result[0].offers as Record<string, unknown>).price).toBe('$3,500/mes');
  });

  it('includes custom_attributes as additionalProperty', () => {
    const result = buildServiceJsonLd(mockEntity.services);
    const props = result[0].additionalProperty as Array<Record<string, unknown>>;

    expect(props).toHaveLength(2);
    expect(props[0].name).toBe('age_range');
    expect(props[0].value).toBe('2-3 años');
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('generates BreadcrumbList with correct items', () => {
    const result = buildBreadcrumbJsonLd('kinder-hermosillo', 'Kinder en Hermosillo');

    expect(result['@type']).toBe('BreadcrumbList');
    const items = result.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[1].name).toBe('Kinder en Hermosillo');
    expect(items[1].item).toBe('/kinder-hermosillo');
  });
});

describe('buildPlaceJsonLd', () => {
  it('generates Place when coordinates available', () => {
    const result = buildPlaceJsonLd(mockEntity);
    expect(result).not.toBeNull();
    expect(result!['@type']).toBe('Place');
    expect((result!.geo as Record<string, unknown>).latitude).toBe(29.0729);
  });

  it('returns null when no coordinates', () => {
    const entityNoCoords = { ...mockEntity, coordinates: undefined };
    const result = buildPlaceJsonLd(entityNoCoords);
    expect(result).toBeNull();
  });
});

// ============================================
// TESTS: ORCHESTRATOR
// ============================================

describe('buildAllJsonLd', () => {
  it('generates all expected scripts for education vertical', () => {
    const result = buildAllJsonLd(mockEnhancedContent, mockEntity, 'education');

    expect(result.scripts.length).toBeGreaterThanOrEqual(3);

    const types = result.scripts.map((s) => s.type);
    expect(types).toContain('FAQPage');
    expect(types).toContain('EducationalOrganization');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('Place');
  });

  it('uses correct schema type per vertical', () => {
    const healthcare = buildAllJsonLd(mockEnhancedContent, mockEntity, 'healthcare');
    expect(healthcare.scripts.find((s) => s.type === 'MedicalBusiness')).toBeDefined();

    const food = buildAllJsonLd(mockEnhancedContent, mockEntity, 'food_and_beverage');
    expect(food.scripts.find((s) => s.type === 'FoodEstablishment')).toBeDefined();

    const hotel = buildAllJsonLd(mockEnhancedContent, mockEntity, 'hospitality');
    expect(hotel.scripts.find((s) => s.type === 'LodgingBusiness')).toBeDefined();
  });

  it('falls back to LocalBusiness for unknown vertical', () => {
    const result = buildAllJsonLd(mockEnhancedContent, mockEntity, 'unknown_type');

    const types = result.scripts.map((s) => s.type);
    expect(types).toContain('LocalBusiness');
    expect(result.warnings).toContain(
      'Business type "unknown_type" not in vertical registry — using generic LocalBusiness',
    );
  });

  it('includes services in hasOfferCatalog', () => {
    const result = buildAllJsonLd(mockEnhancedContent, mockEntity, 'education');
    const localBiz = result.scripts.find((s) => s.type === 'EducationalOrganization');

    expect(localBiz).toBeDefined();
    const catalog = localBiz!.jsonld.hasOfferCatalog as Record<string, unknown>;
    expect(catalog['@type']).toBe('OfferCatalog');
    expect((catalog.itemListElement as unknown[]).length).toBe(2);
  });

  it('generates warnings for missing optional data', () => {
    const minimalEntity: EntityProfile = {
      business_name: 'Test',
      address: { street: 'St', city: 'City', state: 'State', postal_code: '12345', country: 'MX' },
      phone: '123',
      service_area: ['Area'],
      hours: [{ day: 'monday', open: '09:00', close: '17:00', closed: false }],
      services: [{ name: 'Svc', description: 'Description here' }],
    };

    const result = buildAllJsonLd(mockEnhancedContent, minimalEntity, 'local_services');
    expect(result.warnings.some((w) => w.includes('coordinates'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('review'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('founding year'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('certifications'))).toBe(true);
  });
});

describe('renderJsonLdScripts', () => {
  it('renders script tags with correct type attribute', () => {
    const output = buildAllJsonLd(mockEnhancedContent, mockEntity, 'education');
    const html = renderJsonLdScripts(output);

    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@context": "https://schema.org"');
    expect(html).toContain('"@type": "FAQPage"');
    expect(html).toContain('</script>');
  });
});
