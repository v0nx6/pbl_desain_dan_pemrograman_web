import Link from "next/link";
import { AdminAutoRefresh } from "@/components/admin/admin-auto-refresh";
import { AdminOrdersTable } from "@/components/admin/orders-table";
import { ProductFilters } from "@/components/admin/product-filters";
import { buttonStyles } from "@/components/ui/button";
import { ProductMedia } from "@/components/ui/product-media";
import { SampleTag } from "@/components/ui/status";
import { requireAdminPage } from "@/lib/auth";
import { getAdminCatalog } from "@/lib/catalog";
import { formatIDR } from "@/lib/format";
import { getAdminOrders, getAdminStats } from "@/lib/order-queries";
import { chatThreads, unansweredCount } from "@/lib/mock/inbox";

export const dynamic = "force-dynamic";

const views = ["ringkasan", "pesanan", "produk", "chat"] as const;
type ViewId = (typeof views)[number];

const titles: Record<ViewId, string> = {
  ringkasan: "Ringkasan Toko",
  pesanan: "Pesanan",
  produk: "Produk",
  chat: "Chat",
};

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-ivory-50 p-5">
      <p className="text-sm text-espresso-500">{label}</p>
      <p className="mt-2 text-xl font-semibold break-words tabular-nums sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-espresso-500">{hint}</p>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    ukuran?: string;
    tipe?: string;
    harga?: string;
    terbaik?: string;
    baru?: string;
  }>;
}) {
  const user = await requireAdminPage("/admin");
  const params = await searchParams;
  const active: ViewId = views.includes(params.view as ViewId)
    ? (params.view as ViewId)
    : "ringkasan";

  const [stats, orders, products] = await Promise.all([
    getAdminStats(),
    getAdminOrders(),
    getAdminCatalog(),
  ]);

  const sizes = Array.from(
    new Set(products.flatMap((product) => product.sizes)),
  ).sort((a, b) => a.localeCompare(b, "id"));
  const filterState = {
    ukuran: params.ukuran ?? "",
    tipe: params.tipe === "couple" || params.tipe === "single" ? params.tipe : "",
    harga: params.harga ?? "",
    terbaik: params.terbaik === "1" ? "1" : "",
    baru: params.baru === "1" ? "1" : "",
  };
  const priceRange = filterState.harga
    .split("-")
    .map((value) => Number(value));
  const filteredProducts = products.filter((product) => {
    if (filterState.ukuran && !product.sizes.includes(filterState.ukuran)) {
      return false;
    }
    if (filterState.tipe && product.productType !== filterState.tipe) {
      return false;
    }
    if (
      priceRange.length === 2 &&
      priceRange.every((value) => Number.isFinite(value))
    ) {
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }
    }
    if (filterState.terbaik === "1" && !product.bestSeller) return false;
    if (filterState.baru === "1" && !product.isNew) return false;
    return true;
  });
  const hasFilter = Object.values(filterState).some(Boolean);

  return (
    <>
      {active === "ringkasan" || active === "pesanan" ? (
        <AdminAutoRefresh />
      ) : null}
      <p className="text-sm text-espresso-500">
        Selamat datang, {user.name.split(" ")[0]}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl leading-tight">{titles[active]}</h1>
        <div className="flex flex-wrap gap-3">
          {active === "produk" ? (
            <Link
              href="/admin/produk/baru"
              className={buttonStyles({ variant: "primary" })}
            >
              + Upload Produk
            </Link>
          ) : (
            <Link
              href="/admin?view=pesanan"
              className={buttonStyles({ variant: "secondary" })}
            >
              Lihat pesanan
            </Link>
          )}
        </div>
      </div>

      {active === "ringkasan" ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Pendapatan bulan ini"
              value={formatIDR(stats.revenue)}
              hint="Pesanan terverifikasi"
            />
            <Kpi
              label="Menunggu verifikasi"
              value={String(stats.awaitingVerification)}
              hint="Bukti pembayaran perlu dicek"
            />
            <Kpi
              label="Produk aktif"
              value={String(stats.activeProducts)}
              hint="Tampil di toko"
            />
            <Kpi
              label="Pesanan terbuka"
              value={String(stats.openOrders)}
              hint="Belum selesai atau batal"
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[2.2fr_0.8fr]">
            <section className="min-w-0 rounded-3xl bg-ivory-50 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl">Pesanan terbaru</h2>
                <Link
                  href="/admin?view=pesanan"
                  className="text-sm underline underline-offset-4 hover:text-clay-500"
                >
                  Semua
                </Link>
              </div>
              <div className="mt-4">
                <AdminOrdersTable orders={orders.slice(0, 5)} showDate={false} />
              </div>
            </section>

            <section className="flex min-w-0 flex-col rounded-3xl bg-ivory-50 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl">Chat</h2>
                <SampleTag />
              </div>
              <p className="mt-2 text-xs text-espresso-500">
                Chat masih tersimpan lokal, belum tersambung ke backend.
              </p>
              <ul className="mt-4 space-y-3">
                {chatThreads.map((thread) => (
                  <li key={thread.id}>
                    <Link
                      href="/chat"
                      className="block rounded-2xl bg-ivory-100 p-4 transition-colors hover:bg-ivory-200"
                    >
                      <p className="text-sm font-medium">{thread.name}</p>
                      <p className="mt-1 truncate text-sm text-espresso-500">
                        {thread.preview}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin?view=chat"
                className={buttonStyles({
                  variant: "quiet",
                  className: "mt-auto w-full",
                })}
              >
                Buka chat
              </Link>
            </section>
          </div>
        </>
      ) : null}

      {active === "pesanan" ? (
        <section className="mt-6 rounded-3xl bg-ivory-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl">Semua pesanan</h2>
            <p className="text-xs text-espresso-500">
              {orders.length} pesanan, terbaru di atas
            </p>
          </div>
          <div className="mt-4">
            <AdminOrdersTable orders={orders} />
          </div>
        </section>
      ) : null}

      {active === "produk" ? (
        <div className="mt-6 space-y-4">
          <ProductFilters
            sizes={sizes}
            current={filterState}
            resultCount={filteredProducts.length}
            hasFilter={hasFilter}
          />

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-line bg-ivory-50 px-6 py-14 text-center">
              <p className="font-display text-2xl">
                Tidak ada produk yang cocok
              </p>
              <p className="mt-2 text-sm text-espresso-500">
                Coba longgarkan filter ukuran, kategori, atau harga.
              </p>
              <Link
                href="/admin?view=produk"
                className={buttonStyles({
                  variant: "secondary",
                  className: "mt-5",
                })}
              >
                Reset filter
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const stock = Object.values(product.stockBySize).reduce(
                  (total, value) => total + value,
                  0,
                );

                return (
                  <Link
                    key={product.id}
                    href={`/admin/produk/${product.id}`}
                    className="flex gap-4 rounded-3xl bg-ivory-50 p-4 transition-colors hover:bg-ivory-200"
                  >
                    <ProductMedia
                      product={product}
                      showLabel={false}
                      radius="rounded-xl"
                      className="h-28 w-24 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm text-espresso-500">
                        {formatIDR(product.price)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-espresso-500">
                          {product.productType === "couple"
                            ? "Couple"
                            : "Single"}
                        </span>
                        {product.bestSeller ? (
                          <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[11px]">
                            Terbaik
                          </span>
                        ) : null}
                        {product.isNew ? (
                          <span className="rounded-full bg-clay-500 px-2 py-0.5 text-[11px] text-white">
                            Baru
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`mt-2 text-xs ${
                          product.active ? "text-sage-700" : "text-clay-600"
                        }`}
                      >
                        {product.active ? "Aktif di toko" : "Tidak aktif"}
                      </p>
                      <p className="mt-1 text-xs text-espresso-500">
                        Total stok {stock}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {active === "chat" ? (
        <section className="mt-6 rounded-3xl bg-ivory-50 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl">Percakapan terbaru</h2>
            <SampleTag />
          </div>
          <p className="mt-2 text-sm text-espresso-500">
            Ada {unansweredCount()} pesan belum dibalas di data contoh. Chat
            belum tersambung ke backend, jadi balasan hanya tersimpan di
            perangkat ini.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {chatThreads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href="/chat"
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-clay-500"
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {thread.name}
                    </span>
                    <span className="mt-1 block text-sm text-espresso-500">
                      {thread.preview}
                    </span>
                  </span>
                  {thread.unread > 0 ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-clay-500 px-2 py-0.5 text-xs text-white">
                      {thread.unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
