import { CheckoutForm } from "@/components/checkout-form";
import { SectionLabel } from "@/components/ui/label";
import { requirePageUser } from "@/lib/auth";
import { midtransConfigured } from "@/lib/midtrans";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requirePageUser("/checkout");

  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-24 sm:px-8 lg:px-10">
      <SectionLabel>Checkout</SectionLabel>
      <h1 className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-tight">
        Selesaikan pesanan
      </h1>
      <p className="mt-3 max-w-xl text-sm text-espresso-500">
        Masuk sebagai {user.name} ({user.email}). Harga dan stok dicek ulang di
        server saat pesanan dibuat.
      </p>

      <div className="mt-8">
        <CheckoutForm user={user} midtransEnabled={midtransConfigured} />
      </div>
    </div>
  );
}
