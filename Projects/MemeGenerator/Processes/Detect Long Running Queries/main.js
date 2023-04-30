const colors = require("ansi-colors");
const cliProgress = require("cli-progress");
const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb://localhost:27017/?maxPoolSize=20&w=majority";
// Create a new MongoClient
const client = new MongoClient(uri);
async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Establish and verify connection
    var adminDb = await client.db("admin");
    var db = await client.db("MemeGenerator");

    var ops = (await adminDb.command({ "currentOp": 1, "active": true })).inprog;

    let maxSeconds = 10;

    ops = ops.filter(op => (op.secs_running > maxSeconds));
      
    for (op of ops) {
      //console.log(op.command);
      await adminDb.command({
        killOp: 1,
        op: op.opid
     });
    };

    console.log(`Found and stopped ${ops.length} long running queries (> 10s).`);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
