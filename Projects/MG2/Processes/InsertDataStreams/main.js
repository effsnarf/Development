const colors = require("ansi-colors");
const cliProgress = require("cli-progress");
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const { MongoClient } = require("mongodb");

// create a new progress bar instance and use shades_classic theme
const bar1 = new cliProgress.SingleBar({
  format:
    "Fix database |" +
    colors.cyan("{bar}") +
    "| {percentage}% || {value}/{total} Chunks || Deleted: {commentsDeleted}",
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
});

// Connection URI
const uri = "mongodb://localhost:27017/?maxPoolSize=20&w=majority";
// Create a new MongoClient
const client = new MongoClient(uri);
async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Establish and verify connection
    var db = await client.db("MemeGenerator");
    var dbVars = await db.collection("_Vars");
    var dbInstances = await db.collection("Instances");
    var dbStreamInstances = await db.collection("StreamInstances");

    let pageSize = 12;

    while (true)
    {
      let instances = (await dbInstances.aggregate( [
        { $match: { LanguageCode: "en", TotalVotesScore: { $gte: 50 } } },
        { $sample: { size: pageSize } },
      ]).toArray());

      let i = 0;
      for (inst of instances) inst.Posted = (Date.now() + i);

      let instanceIDs = instances.map(inst => inst.InstanceID);
      await dbStreamInstances.deleteMany({ _id: { $in: instanceIDs } });
      await dbStreamInstances.insertMany(instances);

      console.log(`Inserted ${pageSize} instances into StreamInstances (${instanceIDs})`);
      
      await new Promise((resolve) => { setTimeout(resolve, (pageSize * 1000 / 2)) });
    }

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
