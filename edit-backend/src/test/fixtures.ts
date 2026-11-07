import prisma from "@/lib/prisma";

let counter = 0;
function unique(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`;
}

export async function makeUser(
  over: { name1?: string; name2?: string; deleted?: boolean } = {},
) {
  return prisma.users.create({
    data: {
      users_name1: over.name1 ?? "Test",
      users_name2: over.name2 ?? `User ${unique()}`,
      users_deleted: over.deleted ?? false,
    },
  });
}

export async function makeCategory(
  over: {
    name?: string;
    displayName?: string;
    nestUnder?: number | null;
    showPublic?: boolean;
    order?: number | null;
  } = {},
) {
  const name = over.name ?? `cat-${unique()}`;
  return prisma.categories.create({
    data: {
      categories_name: name,
      categories_displayName: over.displayName ?? name,
      categories_nestUnder: over.nestUnder ?? null,
      categories_showPublic: over.showPublic ?? true,
      categories_order: over.order ?? null,
    },
  });
}

export async function makeEdition(
  over: {
    name?: string;
    printNumber?: number | null;
    deleted?: boolean;
    published?: Date;
  } = {},
) {
  const slug = `edition-${unique()}`;
  return prisma.editions.create({
    data: {
      editions_name: over.name ?? slug,
      editions_slug: slug,
      editions_printNumber: over.printNumber ?? null,
      editions_deleted: over.deleted ?? false,
      editions_published: over.published ?? new Date(),
    },
  });
}

export async function makeS3File(over: { caption?: string | null } = {}) {
  return prisma.s3files.create({
    data: {
      s3files_filename: `file-${unique()}`,
      s3files_extension: "jpg",
      s3files_region: "test",
      s3files_endpoint: "test",
      s3files_cdn_endpoint: "test",
      s3files_bucket: "test",
      s3files_meta_size: BigInt(1),
      s3files_meta_caption: over.caption ?? null,
    },
  });
}
