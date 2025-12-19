// src/lib/mocks/content.mock.ts

export const contentMock = {
  title: "Best CRM Software",
  slug: "best-crm-software",
  h1: "Best CRM Software in 2025",
  meta_description:
    "Compare the best CRM software in 2025. Features, pricing, pros, cons, and recommendations for businesses.",
  sections: [
    {
      heading_level: "h2",
      heading_text: "What Is CRM Software?",
      content:
        "CRM software helps businesses manage customer relationships, track interactions, and improve sales processes."
    },
    {
      heading_level: "h2",
      heading_text: "Key Features to Look For",
      content:
        "Important CRM features include contact management, automation, reporting, integrations, and scalability."
    },
    {
      heading_level: "h2",
      heading_text: "Top CRM Tools Compared",
      content:
        "This section compares leading CRM platforms based on pricing, features, and ideal use cases."
    }
  ],
  faqs: [
    {
      question: "What is the best CRM for small businesses?",
      answer:
        "The best CRM for small businesses depends on budget and needs, but popular options include HubSpot and Zoho."
    },
    {
      question: "Is CRM software expensive?",
      answer:
        "CRM pricing ranges from free plans to enterprise-level subscriptions depending on features."
    },
    {
      question: "Can CRM software improve sales?",
      answer:
        "Yes. CRM software improves visibility, follow-ups, and customer relationships, which leads to higher sales."
    }
  ],
  cta: {
    text: "Request a Demo",
    position: "bottom"
  },
  metadata: {
    model: "mock",
    prompt_version: "v1.0.0",
    timestamp: new Date().toISOString(),
    word_count: 420
  }
};
