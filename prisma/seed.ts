import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { curriculum } from "../src/lib/content";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  for (const [position, lesson] of curriculum.entries()) {
    const { exercises, ...data } = lesson;
    const prior = curriculum
      .slice(0, position)
      .filter((l) => l.track === lesson.track)
      .at(-1);
    await db.lesson.upsert({
      where: { id: lesson.id },
      create: { ...data, position, prerequisiteId: prior?.id },
      update: { ...data, position, prerequisiteId: prior?.id },
    });
    for (const [index, exercise] of exercises.entries()) {
      const data = { ...exercise, lessonId: lesson.id, position: index };
      await db.exercise.upsert({
        where: { id: exercise.id },
        create: data,
        update: data,
      });
    }
  }
  console.log(
    `Seeded ${curriculum.length} Bulgarian lessons and ${curriculum.reduce((n, l) => n + l.exercises.length, 0)} exercises.`,
  );
}
main().finally(() => db.$disconnect());
