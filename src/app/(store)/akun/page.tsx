import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { buttonStyles } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import { StatusText } from "@/components/ui/status";
import { requirePageUser } from "@/lib/auth";
import { formatDate, formatIDR } from "@/lib/format";
import { getOrdersForUser } from "@/lib/order-queries";

export const metadata = { title: "Akun saya" };

export default async function AccountPage() {
  const user = await requirePageUser("/akun");
  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-[1000px] px-5 pt-10 pb-24 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <SectionLabel>Akun</SectionLabel>
          <h1 className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-tight">
            Halo, {user.name}
          </h1>
          <p className="mt-2 text-sm text-espresso-500">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className={buttonStyles({ variant: "secondary" })}
            >
              Dasbor admin
            </Link>
          ) : null}
          <Link
            href="/akun/favorit"
            className={buttonStyles({ variant: "secondary" })}
          >
            Favorit
          </Link>
          <Link
            href="/akun/profil"
            className={buttonStyles({ variant: "secondary" })}
          >
            Edit profil
          </Link>
          <Link
            href="/try-on"
            className={buttonStyles({ variant: "secondary" })}
          >
            AI Try-On
          </Link>
          <LogoutButton variant="quiet" />
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 border-t border-line pt-8">
          <h2 className="font-display text-2xl">Pesanan saya</h2>
          <Link
            href="/#koleksi"
            className="text-sm underline underline-offset-4 hover:text-clay-500"
          >
            Belanja lagi
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-ivory-50 px-8 py-14 text-center">
            <p className="font-display text-2xl">Belum ada pesanan</p>
            <p className="mt-2 text-sm text-espresso-500">
              Pesanan yang kamu buat akan muncul di sini.
            </p>
            <Link
              href="/#koleksi"
              className={buttonStyles({
                variant: "secondary",
                className: "mt-6",
              })}
            >
              Lihat koleksi
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/akun/pesanan/${order.id}`}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 transition-colors hover:border-espresso-700"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{order.number}</p>
                    <p className="mt-1 text-sm text-espresso-500">
                      {formatDate(order.createdAt)} · {order.itemCount} item
                    </p>
                    <p className="mt-2 text-sm">{order.firstItemName}</p>
                  </div>
                  <div className="text-right">
                    <StatusText status={order.status} />
                    <p className="mt-1 text-sm font-medium">
                      {formatIDR(order.total)}
                    </p>
                    <p className="mt-1 text-xs text-espresso-500">
                      Lihat detail
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
