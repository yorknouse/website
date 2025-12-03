import prisma from "@/lib/prisma";
import "dotenv/config";

async function seedInitialUser() {
  const user = await prisma.users.create({
    data: {
      users_name1: "Nouse",
      users_name2: "Nouse",
      users_googleAppsUsernameNouse: "user.nouse",
      users_googleAppsUsernameYork: "nouse200",
      users_notes: "Dev user for testing",
      users_thumbnail: "",
    },
  });

  const techDirectorPosition = await prisma.positions.create({
    data: {
      positions_displayName: "Technical Director",
      positions_positionsGroups: "1,2,3",
      positions_rank: 1,
      positions_teamPageGroup: 4,
    },
  });

  const techDirectorUserPosition = await prisma.userPositions.create({
    data: {
      users_userid: user.users_userid,
      positions_id: techDirectorPosition.positions_id,
      userPositions_displayName: "Technical Director",
      userPositions_start: new Date("2023-01-01"),
      userPositions_end: new Date("2026-07-01"),
      userPositions_extraPermissions: "all",
      userPositions_show: true,
    },
  });

  console.log("Created user:", user);
}

async function main() {
  console.log("Seeding development database with test data...");
  await seedInitialUser();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
