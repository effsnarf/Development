console.clear();
console.log("Startup...");

const express = require("express");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const mongo = require("mongodb");
const md5 = require("md5");
const fetch = require("node-fetch");

var _port = (process.env.PORT || 8090);
var _maxDbSelectCount = 32;

var _mongoUrl = (process.env.PORT ? "mongodb://localhost:57017" : "mongodb://localhost:27017")

var _imagesFolder = process.env.PORT ?
  "F:\\AnonymousTimes\\Images" :
  (__dirname.replace("\\WebApi", "") + "\\WebImageFiles\\ImageFiles");

var _getTempPath = () => `${process.env.TEMP}\\${(new Date()).valueOf()}.jpg`;

const app = express();

app.use(cookieParser()); 
app.use(fileUpload()); 


// safely handles circular references
JSON.safeStringify = (obj, indent = 2) => {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
};


function logDebug(obj)
{
    fs.appendFile(__dirname + "\\debug2.log", JSON.safeStringify(obj), (err) => {
        if (err) throw err;
    });
}


function _getMaxDbSelectCount(count)
{
    return ((!count) || (count > _maxDbSelectCount)) ?
            _maxDbSelectCount : count;
}

function _getImageFilePath(id)
{
    var fld1n = Math.round(id / 1024 / 1024);
    var fld2n = Math.round(id / 1024);
    var fld1 = `${_imagesFolder}\\${fld1n}`;
    var fld2 = `${_imagesFolder}\\${fld1n}\\${fld2n}`;
    if (!fs.existsSync(fld1)){ fs.mkdirSync(fld1); }
    if (!fs.existsSync(fld2)){ fs.mkdirSync(fld2); }
    return `${fld2}\\${id}.jpg`;
};


function Database()
{
    // Connection URL
    this.mongoUrl = _mongoUrl;

    // Database Name
    this.dbName = "AnonymousTimes";

    this.getColl = (collName, work) => {
        mongo.MongoClient.connect(this.mongoUrl, async (err, db2) => {
            if (err) throw err;
            var dbo = db2.db(this.dbName);
            var collection = dbo.collection(collName);
            await work(collection, dbo);
            db2.close();
        });
    };

    this.getUniqueID = (collName, dbo) => {
        return new Promise(async (resolve, reject) =>
        {
            if (dbo)
            {
                var uniqueIDs = dbo.collection("UniqueIDs");
                var doc = await uniqueIDs.findOneAndUpdate(
                    { _id: collName },
                    { $inc: { value:1 } },
                    { upsert: true });
                resolve(doc.value.value);
                return;
            }

            this.getColl("UniqueIDs", (uniqueIDs) => new Promise(async (res) => {
                var doc = await uniqueIDs.findOneAndUpdate(
                    { _id: collName },
                    { $inc: { value:1 } },
                    { upsert: true });
                res();
                resolve(doc.value.value);
            }));
        });
    };

    this.logException = (ex) => {
        try
        {
            console.log(ex);
            db.getColl("Exceptions", (coll) => new Promise(async (res) => {
                await coll.insertOne({
                    dateTime: (new Date()),
                    message: ex.message,
                    stack: ex.stack
                });
                res();
            }));
        }
        catch {}
    };
}

var db = new Database();


function UsersApi()
{
    this.create = () => new Promise(async (resolve, reject) =>
    {
        var userID = await db.getUniqueID("Users");
        db.getColl("Users", (users) => new Promise(async (res) => {
            await users.insertOne({
                _id: userID,
                created: (new Date())
            });

            var user = await users.findOne({_id: userID});

            resolve(user);
            return;
        }));
    });

    this.select = (args) => new Promise(async (resolve, reject) =>
    {
        db.getColl("Users", (users) => new Promise(async (res) => {
            var user = await users.findOne({_id: args._id});

            resolve(user);
            return;
        }));
    });}

function PostsApi()
{
    this.create = (args) => new Promise(async (resolve, reject) =>
    {
        var now = (new Date());

        delete args.isAdminMode;

        api.tags.create(args.tags);

        args._id = await db.getUniqueID("Posts");
        args.voteScore = 0;
        if (!args.threadPostID) args.latestReplyCreated = now;
        args.created = now;

        db.getColl("Posts", (posts) => new Promise(async (res) => {
            await posts.insertOne(args);

            if (args.threadPostID)
            {
                await posts.updateOne(
                    { _id: args.threadPostID },
                    { $set: { latestReplyCreated: args.created } })
            }
    
            var post = await posts.findOne({_id: args._id});
            res();
            resolve(post);
        }));
    });

    this.delete = (args) => new Promise(async (resolve, reject) =>
    {
        db.getColl("Posts", (posts) => new Promise(async (res) => {
            await posts.deleteOne({_id: args.postID});
            res();        
            resolve();
        }));
    })

    this.list = (args) => new Promise(async (resolve, reject) => {
        if (!args) args = {};

        var isAdminMode = args.isAdminMode;
        delete args.isAdminMode;

        var count = _getMaxDbSelectCount(args.count);
        if (args.threadPostID) count = 256;
        var userID = args.userID;
        delete args.userID;
        var sort = (args.threadPostID ? 1 : -1);

        db.getColl("Posts", (posts, dbo) => new Promise(async (res) => {
            var items = await posts.find(args)
                .sort(args.threadPostID ? {_id:1} : {latestReplyCreated: -1})
                .limit(count)
                .toArray();

            var votes = dbo.collection("Votes");

            // Exclude posts downvoted by current user.
            var downVotes = await votes
                .find({userID: userID, score: -1})
                .toArray();
            
            downVotes = downVotes.map(a => a.postID);
            var items2 = [];
            for (i in items)
            {
                if (!downVotes.includes(items[i]._id))
                {
                    items2.push(items[i]);
                }
                else
                {
                    if (isAdminMode)
                    {
                        items[i].hiddenBcVoteScore = true;
                        items2.push(items[i]);
                    }
                }
            }

            res();                
            resolve(items2);
        }));
    });

    this.vote = (args) => new Promise(async (resolve, reject) =>
    {
        db.getColl("Posts", (posts, dbo) => new Promise(async (res) => {
        
            delete args.isAdminMode;

            var votes = dbo.collection("Votes");

            await votes.deleteMany({ userID: args.userID, postID: args.postID });

            if (args.score == 0) return;

            // Normalize to either +1 or -1.
            args.score = (args.score / Math.abs(args.score));
            args._id = await db.getUniqueID("Votes", dbo);
            args.created  = (new Date());
            
            await votes.insertOne(args);

            var post = await posts.findOne({ _id: args.postID });
            var postVotes = await await votes.find({postID: args.postID}).toArray();
            var sum = 0; for (i in postVotes) sum += postVotes[i].score;
            await posts.updateOne(
                {_id: args.postID },
                { $set: { voteScore: sum } });

            res();

            resolve();        
        }));
    })
}

function TagsApi()
{
    this.create = (tags) => new Promise(async (resolve, reject) => {
        db.getColl("Tags", (collection) => new Promise(async (res) => {
            for (i in tags) await collection.updateOne(
                { _id: tags[i] },
                { $set: { _id: tags[i] } },
                { upsert: true }
            );
            res();
            resolve();
        }));
    });

    this.search = (args) => new Promise(async (resolve, reject) => {
        args.q = (args.q || "").toLowerCase();
        args.count = _getMaxDbSelectCount(args.count);

        db.getColl("Tags", (tags) => new Promise(async (res) => {
            var items = (args.q) ?
                await tags.find({ _id: (new RegExp(args.q, "i")) }).limit(args.count).toArray()
                :
                await tags.find({}).limit(args.count).toArray();

            items = items.map(a => { return { _id: a._id, text: a._id } });

            res();
            resolve(items);
        }));
    });
}

function ImagesApi(api)
{
    this.api = api;

    this.upload = (req) => new Promise(async (resolve, reject) =>
    {
        var tempPath = _getTempPath();

        await req.files.file.mv(tempPath);

        fs.readFile(tempPath, async (err, buf) => {
          var imageMd5 = md5(buf);

          var image = await this.select(imageMd5, tempPath);

          fs.unlink(tempPath, (err) => {}); // delete the file

          resolve(image);
          return;
        });
    });

    this.select = (imageMd5, tempPath) => new Promise(async (resolve, reject) => {
        
        db.getColl("Images", (images) => new Promise(async (res) => {
            var image = await images.findOne({md5: imageMd5});

            if (image != null)
            {
                var image = await images.findOne({md5: imageMd5});

                res();
                resolve(image);
                return;
            }
            if (image == null)
            {
                var id = await db.getUniqueID("Images");
                var path = _getImageFilePath(id);

                fs.copyFile(tempPath, path, async (err) => {
                    if (err) reject(err);

                    await images.insertOne({_id: id, md5: imageMd5});

                    var image = await images.findOne({md5: imageMd5});

                    res();
                    resolve(image);
                    return;
                });
            }
        }));
    });

    this.search = (args) => new Promise(async (resolve, reject) =>
    {
        if (!args) { reject("args is undefined."); return; }
        if (!args.query) { resolve([]); return; }

        api.imageSearches.create(args.query, args.userID);

        var url = `http://api.memegenerator.net//Generators_Search?q=${encodeURI(args.query)}=&apiKey=demo`;
        
        var res = await (await fetch(url)).json();

        var results = res.result;

        var items = results.map(a => { return {imageID: a.imageID, type:"jpg"} });
        
        items = items.slice(0, 10);
        
        resolve(items);
    });

    this.get = (url) => new Promise(async (resolve, reject) =>
    {
        var tempPath = _getTempPath();

        var buf = await (await fetch(url)).buffer();

        fs.writeFile(tempPath, buf, async (err) => {
            if (err) { reject(err); return; }

            var imageMd5 = md5(buf);

            var image = await this.select(imageMd5, tempPath);

            // delete the file
            fs.unlink(tempPath, (err) => {});

            resolve(image);
            return;
        });
    });
}

function ImageSearchesApi()
{
    this.create = (query, userID) => new Promise(async (resolve, reject) =>
    {
        db.getColl("ImageSearches", (imageSearches, dbo) => new Promise(async (res) => {
            await imageSearches.deleteMany({userID: userID, query: query});
            
            var imageSearch = {
                _id: await db.getUniqueID("ImageSearches", dbo),
                created: (new Date()),
                userID: userID,
                query: query
            };
            await imageSearches.insertOne(imageSearch);
            
            res();
            resolve(imageSearch);
        }));

    });

    this.list = (userID) => new Promise(async (resolve, reject) =>
    {
        db.getColl("ImageSearches", (imageSearches, dbo) => new Promise(async (res) => {
            var items = await imageSearches
                .find({userID: userID})
                .sort({_id:-1})
                .limit(5)
                .toArray();

            items = items.map(a => { return {query: a.query} });

            res();
            resolve(items);
            return;
        }));
    });
}

function Api()
{
    this.users = new UsersApi();
    this.posts = new PostsApi();
    this.tags = new TagsApi();
    this.images = new ImagesApi(this);
    this.imageSearches = new ImageSearchesApi();
}

var api = new Api();

app.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.append("Access-Control-Allow-Headers", "*")
    res.append("Content-Type", "application/json");

    if (req.query.args)
        req.args = JSON.parse(req.query.args);
    else if (req.query)
        req.args = (req.query || {});

    req.args.isAdminMode = req.query.isAdminMode;

    next();
});


app.get("/user/create", async (req, res) => {
    var result = await api.users.create(req.args);
    res.status(200).send(JSON.stringify(result));
});

app.get("/user/select", async (req, res) => {
    var result = await api.users.select(req.args);
    res.status(200).send(JSON.stringify(result));
});

app.get("/post/create", async (req, res) => {
    var result = await api.posts.create(req.args);
    res.status(200).send(JSON.stringify(result));
});

app.get("/post/delete", async (req, res) => {
    await api.posts.delete(req.args);
    res.status(200).send("{}");
});

app.get("/post/vote", async (req, res) => {
    await api.posts.vote(req.args);
    res.status(200).send("{}");
});

app.get("/posts/list", async (req, res) => {
    var result = await api.posts.list(req.args);
    res.status(200).send(JSON.stringify(result));
});

app.get("/tags/search", async (req, res) => {
    var result = await api.tags.search(req.args);
    res.status(200).send(JSON.stringify(result));
});

app.post("/images/upload", async(req, res) => {
    var result = await api.images.upload(req);
    res.status(200).send(JSON.stringify(result));
});

app.get("/images/search", async(req, res) => {
    var result = await api.images.search(req.args);
    res.status(200).send(JSON.stringify(result));
});

app.get("/images/get", async(req, res) => {
    var result = await api.images.get(req.args.url);
    res.status(200).send(JSON.stringify(result));
});

app.get("/imageSearches/list", async(req, res) => {
    var result = await api.imageSearches.list(req.args.userID);
    res.status(200).send(JSON.stringify(result));
});

// Error handling
app.use(function (err, req, res, next) {
    res.setHeader("Content-Type", "text/plain");
    console.error(err.stack);
    res.status(500).send(err.stack);
});


app.listen(_port)


console.log("Web API server listening on port " + _port);
console.log();
