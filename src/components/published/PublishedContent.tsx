import type { PublishedResultBundle } from '@/types/schemas';
import type { CitableAnswerUnit, EvidenceLayer, EntityCard } from '@/types/schemas';

function isEnhancedDraft(
  draft: Record<string, unknown>,
): draft is Record<string, unknown> & {
  citable_answer_units: CitableAnswerUnit[];
  evidence_layer: EvidenceLayer;
  entity_card: EntityCard;
} {
  return (
    Array.isArray(draft.citable_answer_units) &&
    draft.evidence_layer != null &&
    draft.entity_card != null
  );
}

export function PublishedContent({ bundle }: { bundle: PublishedResultBundle }) {
  const { content_draft, jsonld_output } = bundle;
  const draftAny = content_draft as unknown as Record<string, unknown>;
  const enhanced = isEnhancedDraft(draftAny);

  return (
    <article itemScope itemType="https://schema.org/Article">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" itemProp="headline">
        {content_draft.h1}
      </h1>

      <p className="text-lg text-gray-600 mb-8 leading-relaxed" itemProp="description">
        {content_draft.meta_description}
      </p>

      {/* Entity Card (enhanced mode) */}
      {enhanced && (
        <section
          className="border border-blue-200 bg-blue-50/50 rounded-xl p-6 mb-8"
          itemScope
          itemType="https://schema.org/LocalBusiness"
        >
          <h2 className="text-xl font-semibold mb-4" itemProp="name">
            {draftAny.entity_card.business_name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <span itemProp="streetAddress">{draftAny.entity_card.address_formatted}</span>
            </div>
            <div>
              <span itemProp="telephone">{draftAny.entity_card.phone}</span>
            </div>
            <div>
              <span itemProp="openingHours">{draftAny.entity_card.hours_summary}</span>
            </div>
            {draftAny.entity_card.rating_summary && (
              <div itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <span itemProp="description">{draftAny.entity_card.rating_summary}</span>
              </div>
            )}
          </div>
          {draftAny.entity_card.services_highlighted.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Servicios destacados:</p>
              <div className="flex flex-wrap gap-2">
                {(draftAny.entity_card.services_highlighted as string[]).map((service: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    itemProp="makesOffer"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Content Sections */}
      <div className="space-y-8 mb-10">
        {content_draft.sections.map((section, index) => {
          const HeadingTag = section.heading_level === 'h2' ? 'h2' : 'h3';
          const headingClass =
            section.heading_level === 'h2'
              ? 'text-2xl font-semibold mb-3'
              : 'text-xl font-semibold mb-3';

          return (
            <section key={index}>
              <HeadingTag className={headingClass}>{section.heading_text}</HeadingTag>
              {section.content.split('\n\n').map((paragraph, pi) => (
                <p key={pi} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </section>
          );
        })}
      </div>

      {/* Citable Answer Units (enhanced mode) */}
      {enhanced && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Preguntas y respuestas</h2>
          <div className="space-y-4">
            {(draftAny.citable_answer_units as CitableAnswerUnit[]).map((unit, i) => (
              <article
                key={i}
                className="border rounded-lg p-4"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 className="font-medium mb-2" itemProp="name">{unit.question}</h4>
                <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                  <p className="text-gray-600 leading-relaxed" itemProp="text">{unit.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Evidence Layer (enhanced mode) */}
      {enhanced && (
        <section className="mb-10 bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Evidencia y fuentes</h2>
          <p className="text-sm text-gray-600 mb-4">
            {(draftAny.evidence_layer as EvidenceLayer).total_claims} claims totales
            {' \u00B7 '}
            {(draftAny.evidence_layer as EvidenceLayer).verifiable_count} verificables
            {' \u00B7 '}
            {((draftAny.evidence_layer as EvidenceLayer).verifiable_ratio * 100).toFixed(0)}% ratio de verificabilidad
          </p>
          <div className="space-y-2">
            {(draftAny.evidence_layer as EvidenceLayer).claims.map((claim, i) => (
              <div
                key={i}
                className={`text-sm p-3 rounded border ${
                  claim.verifiable
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <p>{claim.claim_text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {claim.claim_type} &middot; {claim.source}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      <section
        className="mb-10"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        <h2 className="text-2xl font-semibold mb-6">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {content_draft.faqs.map((faq, index) => (
            <article
              key={index}
              className="border rounded-lg p-5"
              itemScope
              itemType="https://schema.org/Question"
              itemProp="mainEntity"
            >
              <h3 className="font-medium mb-2" itemProp="name">{faq.question}</h3>
              <div
                itemScope
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p className="text-gray-600 leading-relaxed" itemProp="text">{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <aside className="bg-gray-900 text-white rounded-xl p-8 text-center mb-10">
        <p className="text-xl font-semibold">{content_draft.cta.text}</p>
      </aside>

      {/* JSON-LD Scripts */}
      {jsonld_output && jsonld_output.scripts.map((script, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(script.jsonld) }}
        />
      ))}
    </article>
  );
}
