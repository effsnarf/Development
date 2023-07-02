import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";

(async () => {
  const config = (await Configuration.new()).data;
  const db = await Database.new(config.database);

  let fixed = 0;

  let progress = null;

  const commentsCount = await db.count("Comments");
  console.log(`Fixing ${`CommentEntities`.green}..`);

  const commentEntitiesCount = await db.count("CommentEntities");

  console.log(
    `Deleting ${commentEntitiesCount.toLocaleString()} ${
      `CommentEntities`.green
    }..`
  );
  await db.delete("CommentEntities", {});

  console.log(`Fixing Comments..`);
  progress = Progress.newAutoDisplay(commentsCount);

  const shouldDeleteComment = async (comment: any) => {
    // Delete comments whose instance doesn't exist
    const instance = await db.findOneByID("Instances", comment.entityID);
    if (!instance) return true;
    // Delete empty comments
    if (!comment.text?.length) return true;
    // Delete junk comments ("hhhhhhhhhh", "wwwwwwwwww", etc.)
    if (
      comment.length > 1 &&
      Array.from(comment.text.toLowerCase()).distinct().length > 2
    )
      return true;
    // Delete duplicate comments
    const duplicateComments = await db.find("Comments", {
      _id: { $ne: comment._id },
      EntityID: comment.entityID,
      Text: comment.text,
    });
    if (duplicateComments.length) return true;
    return false;
  };

  for await (const comment of db.findAll("Comments")) {
    if (await shouldDeleteComment(comment)) {
      await db.delete("Comments", { _id: comment._id });
      continue;
    }

    let commentEntity = await db.findOneByID(
      "CommentEntities",
      `1/${comment.entityID}`
    );
    if (!commentEntity) {
      commentEntity = {
        _id: `1/${comment.entityID}`,
        entityType: 1,
        entityID: comment.entityID,
        commentsCount: 0,
      };
    }
    commentEntity.commentsCount += 1;
    await db.upsert("CommentEntities", commentEntity, false, false, true);
    fixed++;
    progress.increment();
  }

  const generatorsCount = await db.count("Generators");
  console.log(`Fixing ${`Generators`.green}.${`InstancesCount`.yellow}..`);
  progress = Progress.newAutoDisplay(generatorsCount);

  for await (const gen of db.findAll("Generators")) {
    if (!gen.displayName) continue;

    const instancesCount = await db.count("Instances", {
      GeneratorID: gen._id,
    });
    if (gen.instancesCount !== instancesCount) {
      fixed++;
    }
    progress.increment();
  }

  progress.done();
})();
