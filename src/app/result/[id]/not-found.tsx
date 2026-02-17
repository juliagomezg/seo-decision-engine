export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-8">
        Este resultado no existe o fue eliminado.
      </p>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
      >
        Volver al inicio
      </a>
    </div>
  );
}
