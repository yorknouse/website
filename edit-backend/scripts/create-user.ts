import { PrismaClient } from "@prisma/client";
import readline from "readline";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOSTNAME,
  port: isNaN(Number(process.env.MYSQL_PORT)) ? 3306 : Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const NAME_REGEX = /^\p{L}[\p{L} .'-]{0,98}\p{L}$/u;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function ask(q: string): Promise<string> {
  return new Promise((res) => rl.question(q, res));
}

async function main() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev-only script");
  }

  if (!process.env.MYSQL_HOSTNAME) {
    throw new Error("MYSQL_HOSTNAME is required");
  }

  if (!process.env.MYSQL_USERNAME) {
    throw new Error("MYSQL_USERNAME is required");
  }

  if (!process.env.MYSQL_PASSWORD) {
    throw new Error("MYSQL_PASSWORD is required");
  }

  if (!process.env.MYSQL_DATABASE) {
    throw new Error("MYSQL_DATABASE is required");
  }

  let firstName = await ask("First name: ");
  let lastName = await ask("Last name: ");
  let yorkEmail: string | null = (
    await ask("York email (press enter to leave blank): ")
  ).toLowerCase();
  let nouseEmail: string | null = (
    await ask("Nouse email (press enter to leave blank): ")
  ).toLowerCase();

  if (!yorkEmail || yorkEmail.length < 1) {
    yorkEmail = null;
  }

  if (!nouseEmail || nouseEmail.length < 1) {
    nouseEmail = null;
  }

  if (!yorkEmail && !nouseEmail) {
    throw new Error("No valid email");
  }

  if (!NAME_REGEX.test(firstName)) {
    throw new Error("First name is required");
  }

  if (!NAME_REGEX.test(lastName)) {
    throw new Error("First name is required");
  }

  if (/[ .'-]{2,}/.test(firstName)) {
    throw new Error("First name contains repeated special characters");
  }
  if (/[ .'-]{2,}/.test(lastName)) {
    throw new Error("Last name contains repeated special characters");
  }

  if (
    yorkEmail &&
    (!yorkEmail.endsWith("@york.ac.uk") || !EMAIL_REGEX.test(yorkEmail))
  ) {
    throw new Error("York email must be a @york.ac.uk address");
  }

  if (
    nouseEmail &&
    (!nouseEmail.endsWith("@nouse.co.uk") || !EMAIL_REGEX.test(nouseEmail))
  ) {
    throw new Error("Nouse email must be a @nouse.co.uk address");
  }

  const position = await prisma.positions.findFirst({
    where: {
      positions_displayName: "Technical Director",
    },
  });

  if (!position) {
    throw new Error("No position found, please seed database first.");
  }

  // Create user
  const user = await prisma.users.create({
    data: {
      users_name1: firstName,
      users_name2: lastName,
      users_googleAppsUsernameNouse: nouseEmail
        ? nouseEmail.replaceAll("@nouse.co.uk", "")
        : null,
      users_googleAppsUsernameYork: yorkEmail
        ? yorkEmail.replaceAll("@nouse.co.uk", "")
        : null,
      users_suspended: false,
    },
  });

  // Assign role
  await prisma.userPositions.create({
    data: {
      users_userid: user.users_userid,
      positions_id: position.positions_id,
      userPositions_start: new Date(),
    },
  });

  console.log("User created");
  console.log(`User ID: ${user.users_userid}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
