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
    var dbComments = await db.collection("Comments");
    var dbCommentEntities = await db.collection("CommentEntities");

    let vars = {
      get: async (key, defaultValue) => {
        let dbVar = (
          await (await dbVars.find({ _id: key })).limit(4).toArray()
        )[0];
        if (dbVar) return dbVar.value;
        if (!dbVar) {
          await dbVars.insertOne({ _id: key, value: defaultValue });
          return defaultValue;
        }
      },
      set: async (key, value) => {
        await dbVars.updateOne({ _id: key }, { $set: { value: value } });
      },
    };

    let batchSize = 1000;
    let processedCommentID = (await vars.get(`processedCommentID`, 0));
    let processedInstanceID = (await vars.get(`processedInstanceID`, 0));

    console.log(`Counting items...`);

    let itemsProcessed = 0;
    let commentsLeft = (await dbComments.estimatedDocumentCount());
    let instancesLeft = (await dbInstances.estimatedDocumentCount());
  //  commentsLeft = (await dbComments.find({
  //     _id: { $gt: processedCommentID },
  //  }));
  //  instancesLeft = await dbInstances.countDocuments({
  //   _id: { $gt: processedInstanceID },
  //  });
   let itemsLeft = (commentsLeft + instancesLeft);

    var progressVars = {
      commentsProcessed: 0,
      commentsDeleted: 0,
      instancesProcessed: 0
    };

    let items = {
      getNextBatch: async () => {
        let comments = await (
          (await (dbComments
            .find({ _id: { $gt: processedCommentID } })
            .sort({ _id: 1 })
            .limit(batchSize))
        )).toArray();

        let instances = await (
          (await (dbInstances
            .find({ _id: { $gt: processedInstanceID } })
            .sort({ _id: 1 })
            .limit(batchSize))
        )).toArray();

        return { comments: comments, instances: instances };
      },
      isSpamComment: function (comment) {
        if (!comment) return null;
        if (comment.entityVotesSummary?.totalVotesSum < -5) return true;
        var text = comment?.Text?.toLowerCase();
        if (!text) return null;
        var spamWords = [
          `http:/`,
          `https:/`,
          `.com`,
          `whatsapp`,
          `\u00AD`,
          `@gmail`,
          `+9`,
          `make money`,
          `pornhub`,
          `$`,
          `nude`,
        ];
        if (spamWords.some((s) => text.includes(s))) return true;
        return false;
      },
      deleteComment: async (comment) => {
        await dbComments.deleteOne({ _id: comment._id });
        progressVars.commentsDeleted++;
      },
      updateInstance: async (instance) => {
        let text = [instance.Text0, instance.Text1].filter(s => s).join(` `);
        let detectedLanguage = null;
        if (text.length)
        {
          try
          {
            detectedLanguage = lngDetector.detect(text)[0][0];
          }
          catch (ex) {}
        }
        let commentsCount = (await dbComments.count({ EntityType: 1, EntityID: instance._id }));

        let update = {
          CommentsCount: commentsCount
        };

        if (detectedLanguage?.length)
        {
          update.LanguageCode = detectedLanguage.substring(0, 2);
        }

        await dbCommentEntities.updateOne({ _id: `1/${instance._id}` },
          { $set: { CommentsCount: commentsCount } });

        await dbInstances.updateOne({ _id: instance._id },
          { $set: update, $unset: { DetectedLanguage: "" } });
      }
    };

    console.log();
    console.log(`Processing ${itemsLeft} items`);
    bar1.start(itemsLeft, 0, progressVars);

    do {
      var nextItems = (await items.getNextBatch());

      for (comment of nextItems.comments) {
        //console.log(comment.Text);
        
        if (items.isSpamComment(comment)) await items.deleteComment(comment);

        processedCommentID = comment._id;
        if (0 == processedCommentID % 100)
          await vars.set(`processedCommentID`, processedCommentID);
        itemsProcessed++;
        progressVars.commentsProcessed++;
        bar1.update(itemsProcessed, progressVars);
      }

      for (instance of nextItems.instances) {
        
        await items.updateInstance(instance);

        processedInstanceID = instance._id;
        if (0 == processedInstanceID % 100)
          await vars.set(`processedInstanceID`, processedInstanceID);
        itemsProcessed++;
        progressVars.instancesProcessed++;
        bar1.update(itemsProcessed, progressVars);
      }

    } while (nextItems.comments.length || nextItems.instances.length);

    bar1.stop();

    //var comments = await (await dbComments.find({})).limit(4).toArray();

    //console.log(comments);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
