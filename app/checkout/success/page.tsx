import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Purchase complete!</h1>
        <p className="text-muted-foreground">
          Check your email for your download link.
        </p>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
