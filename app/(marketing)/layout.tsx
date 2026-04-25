import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="border-b sticky top-0 bg-background/80 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">
            CreatorOS
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </nav>
      {children}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          © 2026 CreatorOS. Built by the team behind{" "}
          <a href="https://freelanceoshq.com" className="underline">
            FreelanceOS
          </a>
          .
        </p>
      </footer>
    </>
  );
}
