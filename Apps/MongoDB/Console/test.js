
await dbs.MG3.delete("Generators", {});

const adviceAnimals = [
    "Philosoraptor",
    "Grumpy Cat",
    "Forever Alone",
    "Insanity Wolf",
    "Pedobear",
    "Socially Awkward Penguin",
    "Slowpoke",
    "Foul Bachelor Frog",
];

const gens = await dbs.MemeGenerator.find("Generators", { DisplayName: { $in: adviceAnimals } }, {});

await dbs.MG3.upsert("Generators", gens);