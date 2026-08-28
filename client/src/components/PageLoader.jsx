import Skeleton from "./Skeleton";

// Fallback di Suspense per le pagine caricate con React.lazy: replica
// l'ingombro tipico di una pagina (titolo + blocco contenuto) per evitare
// un flash vuoto o un layout shift quando il chunk arriva.
function PageLoader() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full flex flex-col gap-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default PageLoader;
