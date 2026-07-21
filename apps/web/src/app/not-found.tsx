import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-[20px]">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-on-surface-variant text-[32px]">search_off</span>
      </div>
      <h1 className="text-[40px] font-bold text-on-background leading-none mb-2">404</h1>
      <h2 className="text-[18px] font-semibold text-on-surface mb-3">Page not found</h2>
      <p className="text-[14px] text-on-surface-variant max-w-md mb-8">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.98] transition-transform"
      >
        Return Home
      </Link>
    </div>
  );
}
