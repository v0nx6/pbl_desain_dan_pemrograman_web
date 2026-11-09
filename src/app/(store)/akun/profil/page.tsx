import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteAccount } from "@/components/delete-account";
import { PasswordForm } from "@/components/password-form";
import { ProfileForm } from "@/components/profile-form";
import { SectionLabel } from "@/components/ui/label";
import { buttonStyles } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Profil saya",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ lengkapi?: string }>;
}) {
  const session = await requirePageUser("/akun/profil");
  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      email: true,
      phone: true,
      addressLine: true,
      city: true,
      postalCode: true,
      addressNote: true,
      role: true,
    },
  });

  if (!user) notFound();
  const needsAddress = params.lengkapi === "alamat" && !user.addressLine;

  return (
    <div className="mx-auto max-w-[900px] px-5 pt-10 pb-24 sm:px-8 lg:px-10">
      <nav aria-label="Remah roti" className="text-sm text-espresso-500">
        <Link href="/akun" className="hover:text-clay-500">
          Akun
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-espresso-900">Profil</span>
      </nav>

      <SectionLabel>Akun</SectionLabel>
      <h1 className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-tight">
        Profil saya
      </h1>
      <p className="mt-2 max-w-xl text-sm text-espresso-500">
        Perbarui nama, email, nomor telepon, dan alamat pengiriman. Data ini
        dipakai untuk mengisi checkout berikutnya.
      </p>

      {needsAddress ? (
        <p
          role="status"
          className="mt-5 rounded-2xl border border-sage-700 bg-ivory-50 p-4 text-sm text-sage-700"
        >
          Isi nomor telepon dan alamat pengiriman dulu sebelum checkout.
        </p>
      ) : null}

      <section className="mt-8 rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Butuh bantuan?</h2>
            <p className="mt-1 max-w-md text-sm text-espresso-500">
              Ada pertanyaan soal ukuran, pesanan, atau pembayaran? Chat admin
              toko langsung dari sini.
            </p>
          </div>
          <Link
            href="/chat"
            className={buttonStyles({ variant: "secondary" })}
          >
            Buka chat
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
        <ProfileForm user={user} />
      </section>

      <section className="mt-8 rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
        <h2 className="font-display text-2xl">Ubah kata sandi</h2>
        <p className="mt-1 text-sm text-espresso-500">
          Pakai kata sandi yang kuat dan jangan sama dengan situs lain.
        </p>
        <div className="mt-5">
          <PasswordForm hasPassword={session.hasPassword} />
        </div>
      </section>

      {user.role === "CUSTOMER" ? (
        <section className="mt-8 rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
          <h2 className="font-display text-2xl">Hapus akun</h2>
          <div className="mt-2">
            <DeleteAccount hasPassword={session.hasPassword} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
