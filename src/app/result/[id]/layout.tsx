export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        <a href="/" className="hover:text-gray-700 underline underline-offset-4">
          SEO Decision Engine
        </a>
      </footer>
    </div>
  );
}
