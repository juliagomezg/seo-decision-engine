/**
 * JSON-LD Builders — Deterministic, no LLM.
 *
 * Pure functions that transform validated EntityProfile + EnhancedContentDraft
 * into schema.org JSON-LD scripts. All data comes from Zod-validated sources.
 */

import type {
  EntityProfile,
  EnhancedContentDraft,
  CitableAnswerUnit,
  JsonLdOutput,
  Service,
} from '@/types/schemas';

// ============================================
// TYPES
// ============================================

type JsonLdObject = Record<string, unknown>;

interface VerticalConfig {
  schemaType: string;
  extraBuilders: Array<(entity: EntityProfile) => JsonLdObject | null>;
}

// ============================================
// UNIVERSAL BUILDERS
// ============================================

export function buildFAQPageJsonLd(units: CitableAnswerUnit[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: units.map((u) => ({
      '@type': 'Question',
      name: u.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: u.answer,
      },
    })),
  };
}

export function buildLocalBusinessJsonLd(
  entity: EntityProfile,
  schemaType: string = 'LocalBusiness',
): JsonLdObject {
  const jsonld: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: entity.business_name,
    telephone: entity.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: entity.address.street,
      addressLocality: entity.address.city,
      addressRegion: entity.address.state,
      postalCode: entity.address.postal_code,
      addressCountry: entity.address.country,
    },
  };

  if (entity.email) {
    jsonld.email = entity.email;
  }
  if (entity.website) {
    jsonld.url = entity.website;
  }
  if (entity.business_type_detail) {
    jsonld.description = entity.business_type_detail;
  }

  // Coordinates
  if (entity.coordinates) {
    jsonld.geo = {
      '@type': 'GeoCoordinates',
      latitude: entity.coordinates.latitude,
      longitude: entity.coordinates.longitude,
    };
  }

  // Opening hours
  const openHours = entity.hours.filter((h) => !h.closed);
  if (openHours.length > 0) {
    jsonld.openingHoursSpecification = openHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.day.charAt(0).toUpperCase() + h.day.slice(1),
      opens: h.open,
      closes: h.close,
    }));
  }

  // Aggregate rating
  if (entity.average_rating && entity.review_count) {
    jsonld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: entity.average_rating,
      reviewCount: entity.review_count,
    };
  }

  // Founding year
  if (entity.founding_year) {
    jsonld.foundingDate = String(entity.founding_year);
  }

  // Service area
  if (entity.service_area.length > 0) {
    jsonld.areaServed = entity.service_area.map((area) => ({
      '@type': 'Place',
      name: area,
    }));
  }

  // Custom attributes as additionalProperty
  if (entity.custom_attributes && Object.keys(entity.custom_attributes).length > 0) {
    jsonld.additionalProperty = Object.entries(entity.custom_attributes).map(
      ([name, value]) => ({
        '@type': 'PropertyValue',
        name,
        value,
      }),
    );
  }

  return jsonld;
}

export function buildServiceJsonLd(services: Service[]): JsonLdObject[] {
  return services.map((s) => {
    const service: JsonLdObject = {
      '@type': 'Service',
      name: s.name,
      description: s.description,
    };

    if (s.price_range) {
      service.offers = {
        '@type': 'Offer',
        price: s.price_range,
      };
    }

    // Custom attributes as additionalProperty
    if (s.custom_attributes && Object.keys(s.custom_attributes).length > 0) {
      service.additionalProperty = Object.entries(s.custom_attributes).map(
        ([name, value]) => ({
          '@type': 'PropertyValue',
          name,
          value,
        }),
      );
    }

    return service;
  });
}

export function buildBreadcrumbJsonLd(slug: string, title: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: `/${slug}`,
      },
    ],
  };
}

export function buildPlaceJsonLd(entity: EntityProfile): JsonLdObject | null {
  if (!entity.coordinates) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: entity.business_name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: entity.address.street,
      addressLocality: entity.address.city,
      addressRegion: entity.address.state,
      postalCode: entity.address.postal_code,
      addressCountry: entity.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: entity.coordinates.latitude,
      longitude: entity.coordinates.longitude,
    },
  };
}

// ============================================
// VERTICAL-SPECIFIC BUILDERS
// ============================================

function buildEducationalOrgExtras(entity: EntityProfile): JsonLdObject | null {
  const attrs = entity.custom_attributes ?? {};
  const extras: JsonLdObject = {};

  if (attrs.methodology) extras.educationalFramework = attrs.methodology;
  if (attrs.target_ages) extras.audience = { '@type': 'EducationalAudience', educationalRole: attrs.target_ages };
  if (attrs.capacity) extras.maximumAttendeeCapacity = attrs.capacity;

  return Object.keys(extras).length > 0 ? extras : null;
}

function buildFoodEstablishmentExtras(entity: EntityProfile): JsonLdObject | null {
  const attrs = entity.custom_attributes ?? {};
  const extras: JsonLdObject = {};

  if (attrs.cuisine_type) extras.servesCuisine = attrs.cuisine_type;
  if (attrs.delivery) extras.hasDeliveryMethod = { '@type': 'DeliveryMethod' };
  if (attrs.reservations) extras.acceptsReservations = 'True';

  return Object.keys(extras).length > 0 ? extras : null;
}

function buildMedicalBusinessExtras(entity: EntityProfile): JsonLdObject | null {
  const attrs = entity.custom_attributes ?? {};
  const extras: JsonLdObject = {};

  if (attrs.specialties) extras.medicalSpecialty = attrs.specialties;
  if (attrs.emergency) extras.isAcceptingNewPatients = 'True';
  if (attrs.insurance) extras.paymentAccepted = attrs.insurance;

  return Object.keys(extras).length > 0 ? extras : null;
}

function buildLodgingBusinessExtras(entity: EntityProfile): JsonLdObject | null {
  const attrs = entity.custom_attributes ?? {};
  const extras: JsonLdObject = {};

  if (attrs.star_rating) extras.starRating = { '@type': 'Rating', ratingValue: attrs.star_rating };
  if (attrs.check_in) extras.checkinTime = attrs.check_in;
  if (attrs.check_out) extras.checkoutTime = attrs.check_out;

  return Object.keys(extras).length > 0 ? extras : null;
}

function buildProfessionalServiceExtras(entity: EntityProfile): JsonLdObject | null {
  const attrs = entity.custom_attributes ?? {};
  const extras: JsonLdObject = {};

  if (attrs.practice_areas) extras.knowsAbout = attrs.practice_areas;
  if (attrs.languages) extras.knowsLanguage = attrs.languages;

  return Object.keys(extras).length > 0 ? extras : null;
}

// ============================================
// VERTICAL REGISTRY
// ============================================

const VERTICAL_REGISTRY: Record<string, VerticalConfig> = {
  education: {
    schemaType: 'EducationalOrganization',
    extraBuilders: [buildEducationalOrgExtras],
  },
  healthcare: {
    schemaType: 'MedicalBusiness',
    extraBuilders: [buildMedicalBusinessExtras],
  },
  food_and_beverage: {
    schemaType: 'FoodEstablishment',
    extraBuilders: [buildFoodEstablishmentExtras],
  },
  local_services: {
    schemaType: 'LocalBusiness',
    extraBuilders: [],
  },
  professional_services: {
    schemaType: 'ProfessionalService',
    extraBuilders: [buildProfessionalServiceExtras],
  },
  real_estate: {
    schemaType: 'RealEstateAgent',
    extraBuilders: [],
  },
  hospitality: {
    schemaType: 'LodgingBusiness',
    extraBuilders: [buildLodgingBusinessExtras],
  },
  saas: {
    schemaType: 'SoftwareApplication',
    extraBuilders: [],
  },
};

// ============================================
// ORCHESTRATOR
// ============================================

export function buildAllJsonLd(
  content: EnhancedContentDraft,
  entity: EntityProfile,
  businessType: string,
): JsonLdOutput {
  const scripts: Array<{ type: string; jsonld: JsonLdObject }> = [];
  const warnings: string[] = [];

  // 1. FAQPage (always, from citable answer units)
  if (content.citable_answer_units.length > 0) {
    scripts.push({
      type: 'FAQPage',
      jsonld: buildFAQPageJsonLd(content.citable_answer_units),
    });
  } else {
    warnings.push('No citable answer units available for FAQPage JSON-LD');
  }

  // 2. LocalBusiness (always, with vertical-specific schema type)
  const verticalConfig = VERTICAL_REGISTRY[businessType];
  const schemaType = verticalConfig?.schemaType ?? 'LocalBusiness';

  const localBusinessJsonLd = buildLocalBusinessJsonLd(entity, schemaType);

  // Merge vertical-specific extras into LocalBusiness
  if (verticalConfig?.extraBuilders) {
    for (const builder of verticalConfig.extraBuilders) {
      const extras = builder(entity);
      if (extras) {
        Object.assign(localBusinessJsonLd, extras);
      }
    }
  }

  // Nest services in hasOfferCatalog
  if (entity.services.length > 0) {
    localBusinessJsonLd.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: buildServiceJsonLd(entity.services),
    };
  }

  scripts.push({
    type: schemaType,
    jsonld: localBusinessJsonLd,
  });

  // 3. BreadcrumbList (always)
  scripts.push({
    type: 'BreadcrumbList',
    jsonld: buildBreadcrumbJsonLd(content.slug, content.title),
  });

  // 4. Place (if coordinates available)
  const placeJsonLd = buildPlaceJsonLd(entity);
  if (placeJsonLd) {
    scripts.push({ type: 'Place', jsonld: placeJsonLd });
  } else {
    warnings.push('No coordinates provided — Place JSON-LD not generated');
  }

  // 5. Warnings for missing data
  if (!entity.average_rating || !entity.review_count) {
    warnings.push('No review data — AggregateRating not included in LocalBusiness');
  }
  if (!entity.founding_year) {
    warnings.push('No founding year — foundingDate not included');
  }
  if (!entity.certifications?.length) {
    warnings.push('No certifications — E-E-A-T signal missing');
  }
  if (!verticalConfig) {
    warnings.push(`Business type "${businessType}" not in vertical registry — using generic LocalBusiness`);
  }

  return { scripts, warnings };
}

/**
 * Renders JSON-LD scripts as HTML <script> tags for embedding.
 */
export function renderJsonLdScripts(output: JsonLdOutput): string {
  return output.scripts
    .map(
      (s) =>
        `<script type="application/ld+json">\n${JSON.stringify(s.jsonld, null, 2)}\n</script>`,
    )
    .join('\n\n');
}
