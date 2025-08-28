import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CheckoutPage() {
  const router = useRouter();

  // Redirect to unified checkout
  useEffect(() => {
    router.replace("/unified-checkout");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
