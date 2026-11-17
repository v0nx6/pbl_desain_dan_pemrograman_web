import { Collection, PrismaClient, ProductType, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

type SeedProduct = {
    slug: string;
    name: string;
    description: string;
    material: string;
    price: number;
    collections: Collection[];
    productType: ProductType;
    bestSeller: boolean;
    isNew: boolean;
    tone: number;
    image: string;
    imageAlt: string;
    tryOnCategory: "upper_body" | "lower_body" | "dresses";
    tryOnPhotoType: "model" | "flat-lay" | null;
    variants: { size: string; stock: number }[];
};

const products: SeedProduct[] = [
    {
        slug: "kebaya-encim-modern",
        name: "Kebaya Encim Modern",
        collections: [Collection.KEBAYA, Collection.BARU],
        productType: ProductType.SINGLE,
        bestSeller: true,
        isNew: true,
        price: 685000,
        tone: 300,
        image: "/products/kebaya-encim-modern.jpg",
        imageAlt: "Kebaya encim biru dengan kain merah di atas manekin",
        description:
            "Potongan kebaya encim dengan lengan tiga per empat dan bukaan depan. Dijahit rapi dengan furing penuh agar nyaman dipakai seharian.",
        material: "Brokat tenun, furing katun",
        tryOnCategory: "upper_body",
        tryOnPhotoType: "model",
        variants: [
            { size: "S", stock: 8 },
            { size: "M", stock: 10 },
            { size: "L", stock: 8 },
            { size: "XL", stock: 4 },
        ],
    },
    {
        slug: "batik-kawung-selendang",
        name: "Batik Kawung Selendang",
        collections: [Collection.BATIK],
        productType: ProductType.SINGLE,
        bestSeller: false,
        isNew: false,
        price: 425000,
        tone: 400,
        image: "/products/batik-kawung-selendang.jpg",
        imageAlt: "Detail motif batik kawung berwarna cokelat dan krem",
        description:
            "Selendang batik tulis dengan motif kawung. Pewarna alami, tepi dijahit tangan.",
        material: "Katun primisima",
        tryOnCategory: "upper_body",
        tryOnPhotoType: null,
        variants: [{ size: "All size", stock: 6 }],
    },
    {
        slug: "lurik-linen-set",
        name: "Lurik Linen Set",
        collections: [Collection.BARU],
        productType: ProductType.SINGLE,
        bestSeller: false,
        isNew: true,
        price: 549000,
        tone: 200,
        image: "/products/lurik-linen-set.jpg",
        imageAlt: "Tumpukan kain tenun lurik dengan warna alami",
        description:
            "Set atasan dan rok dari linen lurik. Siluet longgar, cocok untuk acara siang.",
        material: "Linen lurik",
        tryOnCategory: "dresses",
        tryOnPhotoType: null,
        variants: [
            { size: "S", stock: 5 },
            { size: "M", stock: 6 },
            { size: "L", stock: 4 },
        ],
    },
    {
        slug: "kebaya-kutubaru",
        name: "Kebaya Kutubaru",
        collections: [Collection.KEBAYA],
        productType: ProductType.SINGLE,
        bestSeller: false,
        isNew: false,
        price: 725000,
        tone: 300,
        image: "/products/kebaya-kutubaru.jpg",
        imageAlt: "Detail bordir merah pada kebaya",
        description:
            "Kebaya kutubaru dengan bef dan kancing tempel. Garis leher dibuat tangan.",
        material: "Brokat, furing sifon",
        tryOnCategory: "upper_body",
        tryOnPhotoType: "model",
        variants: [
            { size: "S", stock: 6 },
            { size: "M", stock: 7 },
            { size: "L", stock: 3 },
        ],
    },
    {
        slug: "blouse-tenun-sumba",
        name: "Blouse Tenun Sumba",
        collections: [Collection.BARU],
        productType: ProductType.SINGLE,
        bestSeller: false,
        isNew: false,
        price: 495000,
        tone: 400,
        image: "/products/blouse-tenun-sumba.jpg",
        imageAlt: "Kain tenun ikat dengan motif geometris",
        description:
            "Blouse dari tenun ikat Sumba dengan potongan lurus dan lengan balon.",
        material: "Tenun ikat",
        tryOnCategory: "upper_body",
        tryOnPhotoType: null,
        variants: [
            { size: "S", stock: 7 },
            { size: "M", stock: 5 },
            { size: "L", stock: 4 },
        ],
    },
    {
        slug: "batik-tulis-parang",
        name: "Batik Tulis Parang",
        collections: [Collection.BATIK],
        productType: ProductType.SINGLE,
        bestSeller: true,
        isNew: false,
        price: 890000,
        tone: 500,
        image: "/products/batik-tulis-parang.jpg",
        imageAlt: "Kain batik tulis motif parang",
        description:
            "Kain batik tulis motif parang. Satu lembar, satu warna, tidak ada duplikat.",
        material: "Katun primisima",
        tryOnCategory: "lower_body",
        tryOnPhotoType: null,
        variants: [{ size: "2m x 1m", stock: 2 }],
    },
    {
        slug: "outer-tenun-ikat",
        name: "Outer Tenun Ikat",
        collections: [Collection.BARU, Collection.BATIK],
        productType: ProductType.SINGLE,
        bestSeller: false,
        isNew: true,
        price: 610000,
        tone: 300,
        image: "/products/outer-tenun-ikat.jpg",
        imageAlt: "Outer tenun ikat gelap yang dikenakan dari belakang",
        description:
            "Outer tanpa kancing dari tenun ikat. Dipakai terbuka di atas kebaya atau kaus.",
        material: "Tenun ikat, tanpa furing",
        tryOnCategory: "upper_body",
        tryOnPhotoType: "model",
        variants: [{ size: "All size", stock: 4 }],
    },
    {
        slug: "kebaya-brokat",
        name: "Kebaya Brokat",
        collections: [Collection.KEBAYA],
        productType: ProductType.SINGLE,
        bestSeller: true,
        isNew: false,
        price: 960000,
        tone: 200,
        image: "/products/kebaya-brokat.jpg",
        imageAlt: "Kebaya putih dengan kain batik di museum",
        description:
            "Kebaya brokat dengan bordir halus di bagian lengan dan ujung kebaya.",
        material: "Brokat bordir, furing satin",
        tryOnCategory: "upper_body",
        tryOnPhotoType: "model",
        variants: [
            { size: "S", stock: 4 },
            { size: "M", stock: 5 },
            { size: "L", stock: 3 },
            { size: "XL", stock: 2 },
        ],
    },
    {
        slug: "kemeja-batik-parang-pria",
        name: "Kemeja Batik Parang Pria",
        collections: [Collection.BATIK, Collection.PRIYA],
        productType: ProductType.SINGLE,
        bestSeller: false,
        isNew: true,
        price: 525000,
        tone: 400,
        image: "/products/kemeja-batik-pria.jpg",
        imageAlt: "Kain batik parang biru tua untuk kemeja pria",
        description:
            "Kemeja batik lengan panjang dengan motif parang yang tenang. Potongan lurus, nyaman dipakai untuk kerja maupun acara keluarga.",
        material: "Katun primisima",
        tryOnCategory: "upper_body",
        tryOnPhotoType: "model",
        variants: [
            { size: "M", stock: 7 },
            { size: "L", stock: 8 },
            { size: "XL", stock: 5 },
        ],
    },
    {
        slug: "koko-linen-pria",
        name: "Koko Linen Pria",
        collections: [Collection.BARU, Collection.PRIYA],
        productType: ProductType.SINGLE,
        bestSeller: false,
        isNew: true,
        price: 465000,
        tone: 200,
        image: "/products/koko-linen-pria.jpg",
        imageAlt: "Kain linen krem untuk koko pria",
        description:
            "Koko dari linen dengan kerah pendek dan kancing kayu. Ringan, adem, dan rapi untuk ibadah atau acara santai.",
        material: "Linen katun",
        tryOnCategory: "upper_body",
        tryOnPhotoType: "model",
        variants: [
            { size: "M", stock: 8 },
            { size: "L", stock: 9 },
            { size: "XL", stock: 6 },
        ],
    },
    {
        slug: "blazer-tenun-pria",
        name: "Blazer Tenun Pria",
        collections: [Collection.BARU, Collection.PRIYA],
        productType: ProductType.SINGLE,
        bestSeller: true,
        isNew: false,
        price: 895000,
        tone: 500,
        image: "/products/blazer-tenun-pria.jpg",
        imageAlt: "Kain tenun gelap untuk blazer pria",
        description:
            "Blazer tanpa lapisan tebal dari tenun ikat. Bisa dipakai terbuka di atas kemeja untuk acara yang sedikit lebih formal.",
        material: "Tenun ikat, lining katun",
        tryOnCategory: "upper_body",
        tryOnPhotoType: "model",
        variants: [
            { size: "M", stock: 4 },
            { size: "L", stock: 5 },
            { size: "XL", stock: 3 },
        ],
    },
];

const galleryImages: Record<string, { path: string; alt: string }[]> = {
    "kebaya-encim-modern": [
        {
            path: "/products/kebaya-kutubaru.jpg",
            alt: "Detail bordir dan bahan kebaya",
        },
    ],
    "blouse-tenun-sumba": [
        {
            path: "/products/outer-tenun-ikat.jpg",
            alt: "Detail tenun ikat untuk blouse",
        },
    ],
    "kebaya-brokat": [
        {
            path: "/products/kebaya-kutubaru.jpg",
            alt: "Detail bordir pada kebaya brokat",
        },
    ],
    "kemeja-batik-parang-pria": [
        {
            path: "/products/batik-tulis-parang.jpg",
            alt: "Detail motif parang pada kain batik",
        },
    ],
    "koko-linen-pria": [
        {
            path: "/products/lurik-linen-set.jpg",
            alt: "Detail serat kain linen",
        },
    ],
    "blazer-tenun-pria": [
        {
            path: "/products/outer-tenun-ikat.jpg",
            alt: "Detail tenun ikat untuk blazer",
        },
    ],
};

type Measurements = {
    chestCm?: number;
    lengthCm?: number;
    waistCm?: number;
};

const sizeMeasurements: Record<string, Record<string, Measurements>> = {
    "kebaya-encim-modern": {
        S: { chestCm: 88, lengthCm: 58, waistCm: 72 },
        M: { chestCm: 92, lengthCm: 60, waistCm: 76 },
        L: { chestCm: 96, lengthCm: 62, waistCm: 80 },
        XL: { chestCm: 100, lengthCm: 64, waistCm: 84 },
    },
    "lurik-linen-set": {
        S: { chestCm: 90, lengthCm: 62, waistCm: 74 },
        M: { chestCm: 94, lengthCm: 64, waistCm: 78 },
        L: { chestCm: 98, lengthCm: 66, waistCm: 82 },
    },
    "kebaya-kutubaru": {
        S: { chestCm: 86, lengthCm: 56, waistCm: 70 },
        M: { chestCm: 90, lengthCm: 58, waistCm: 74 },
        L: { chestCm: 94, lengthCm: 60, waistCm: 78 },
    },
    "blouse-tenun-sumba": {
        S: { chestCm: 92, lengthCm: 60 },
        M: { chestCm: 96, lengthCm: 62 },
        L: { chestCm: 100, lengthCm: 64 },
    },
    "outer-tenun-ikat": {
        "All size": { chestCm: 104, lengthCm: 68 },
    },
    "kebaya-brokat": {
        S: { chestCm: 86, lengthCm: 57, waistCm: 70 },
        M: { chestCm: 90, lengthCm: 59, waistCm: 74 },
        L: { chestCm: 94, lengthCm: 61, waistCm: 78 },
        XL: { chestCm: 98, lengthCm: 63, waistCm: 82 },
    },
    "kemeja-batik-parang-pria": {
        M: { chestCm: 100, lengthCm: 72 },
        L: { chestCm: 104, lengthCm: 74 },
        XL: { chestCm: 108, lengthCm: 76 },
    },
    "koko-linen-pria": {
        M: { chestCm: 102, lengthCm: 70 },
        L: { chestCm: 106, lengthCm: 72 },
        XL: { chestCm: 110, lengthCm: 74 },
    },
    "blazer-tenun-pria": {
        M: { chestCm: 100, lengthCm: 70 },
        L: { chestCm: 104, lengthCm: 72 },
        XL: { chestCm: 108, lengthCm: 74 },
    },
};

async function seedUsers() {
    const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@boutique.local").toLowerCase();
    const customerEmail = (
        process.env.CUSTOMER_EMAIL ?? "pelanggan@boutique.local"
    ).toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const customerPassword = process.env.CUSTOMER_PASSWORD;

    if (!adminPassword || !customerPassword) {
        throw new Error(
            "Set ADMIN_PASSWORD and CUSTOMER_PASSWORD in .env before running the seed.",
        );
    }

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            name: "Admin Boutique NC",
            passwordHash: await hashPassword(adminPassword),
            role: Role.ADMIN,
        },
        create: {
            email: adminEmail,
            name: "Admin Boutique NC",
            passwordHash: await hashPassword(adminPassword),
            role: Role.ADMIN,
        },
    });

    await prisma.user.upsert({
        where: { email: customerEmail },
        update: {
            name: "Pelanggan",
            passwordHash: await hashPassword(customerPassword),
            role: Role.CUSTOMER,
        },
        create: {
            email: customerEmail,
            name: "Pelanggan",
            passwordHash: await hashPassword(customerPassword),
            role: Role.CUSTOMER,
        },
    });

    console.log(`Admin    : ${adminEmail} / ${adminPassword}`);
    console.log(`Pelanggan: ${customerEmail} / ${customerPassword}`);
}

async function main() {
    await seedUsers();

    for (const product of products) {
        const data = {
            name: product.name,
            description: product.description,
            material: product.material,
            price: product.price,
            collections: product.collections,
            productType: product.productType,
            bestSeller: product.bestSeller,
            isNew: product.isNew,
            tone: product.tone,
            image: product.image,
            imageAlt: product.imageAlt,
            tryOnCategory: product.tryOnCategory,
            tryOnPhotoType: product.tryOnPhotoType,
            active: true,
        };

        const variants = product.variants.map((variant, index) => ({
            ...variant,
            ...(sizeMeasurements[product.slug]?.[variant.size] ?? {}),
            sortOrder: index,
        }));

        const images = (galleryImages[product.slug] ?? []).map(
            (image, index) => ({
                ...image,
                sortOrder: index,
            }),
        );

        await prisma.product.upsert({
            where: { slug: product.slug },
            update: {
                ...data,
                variants: {
                    deleteMany: {},
                    create: variants,
                },
                images: {
                    deleteMany: {},
                    create: images,
                },
            },
            create: {
                ...data,
                slug: product.slug,
                variants: {
                    create: variants,
                },
                images: {
                    create: images,
                },
            },
        });
    }

    await prisma.siteImage.upsert({
        where: { key: "hero" },
        update: {},
        create: {
            key: "hero",
            image: "/hero-kebaya.jpg",
            imageAlt: "Model memakai kebaya dengan kain batik",
        },
    });

    await prisma.siteImage.upsert({
        where: { key: "story" },
        update: {},
        create: {
            key: "story",
            image: "/artisan-batik.jpg",
            imageAlt: "Perajin sedang mengerjakan kain batik",
        },
    });

    console.log(`Seeded ${products.length} products.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
