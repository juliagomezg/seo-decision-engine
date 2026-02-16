import { WorkflowClient } from '@/components/workflow/WorkflowClient';

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
            SEO Decision Engine
          </h1>
          <p className="text-muted-foreground">La IA sugiere. Tú decides.</p>
        </header>

        <WorkflowClient />
      </div>
    </main>
  );
}
