import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resultStore } from '@/lib/result-store';
import { PublishedContent } from '@/components/published/PublishedContent';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bundle = await resultStore.get(id);
  if (!bundle) return { title: 'No encontrado' };

  const { content_draft, keyword } = bundle;
  const canonicalUrl = `/result/${id}`;

  return {
    title: content_draft.title,
    description: content_draft.meta_description,
    keywords: keyword,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: content_draft.title,
      description: content_draft.meta_description,
      type: 'article',
      locale: 'es_MX',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: content_draft.title,
      description: content_draft.meta_description,
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const bundle = await resultStore.get(id);
  if (!bundle) notFound();

  return <PublishedContent bundle={bundle} />;
}
