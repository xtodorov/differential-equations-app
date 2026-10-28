// Prisma's pinned in-process JS generator avoids the CLI's eager native schema
// engine download. Runtime uses the official PostgreSQL driver adapter.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getGenerators } = require("@prisma/internals");
const { PrismaClientJsGenerator } = require("@prisma/client-generator-js");
const generators = await getGenerators({
  schemaPath: "prisma/schema.prisma",
  cliCommand: "prisma",
  registry: {
    "prisma-client-js": {
      type: "in-process",
      generator: new PrismaClientJsGenerator({ cliCommand: "prisma" }),
    },
  },
});
try {
  for (const generator of generators) await generator.generate();
  console.log("Prisma JavaScript client generated.");
} finally {
  for (const generator of generators) generator.stop();
}
