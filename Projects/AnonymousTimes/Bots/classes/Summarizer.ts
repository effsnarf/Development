import * as colors from "colors";
import * as fs from "fs";
import "../../../../Shared/Extensions";
import { Objects } from "../../../../Shared/Extensions.Objects";
import { Config } from "../../Shared/Config";
import { Config as OpenAiConfig } from "../../../../Apis/OpenAI/classes/Config";
import { MongoDatabase } from "../../../../Shared/Database/MongoDatabase";
import { Thread, Post } from "../../Shared/DataTypes";
import { OpenAI } from "../../../../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Role } from "../../../../Apis/OpenAI/classes/ChatOpenAI";

class Summarizer {
  private db!: MongoDatabase;

  private constructor(config: Config) {}

  public static async new(config: Config, openAiConfig: OpenAiConfig) {
    const summarizer = new Summarizer(config);
    summarizer.db = await MongoDatabase.new(
      config.db.mongo.connection,
      config.db.mongo.database
    );
    OpenAI.apiKey = openAiConfig.apiKey;
    return summarizer;
  }

  async start() {
    console.log("Starting summarizer".cyan);
    console.log();

    while (true) {
      // Get all threads that have not been analyzed yet
      // and have at least 10 posts
      // and are not active anymore
      // and sort them by (newest first)
      const threads = (await this.db.find(
        "Threads",
        {
          analysis: { $exists: false },
          "posts.count": { $gt: 50 },
        },
        {
          "modified.dt": -1,
        }
      )) as Thread[];

      const newsThreads = (await this.db.find(
        "Threads",
        {
          "thread.analysis.article": { $exists: false },
        },
        {
          "scores.news": -1,
        },
        1
      )) as Thread[];

      const customThreads = (await this.db.find("Threads", {
        id: 70238050,
      })) as Thread[];

      console.log(`  ${threads.length} ${`threads found`.gray}`);
      console.log();

      for (const thread of threads) {
        try {
          console.log(
            `#${thread.id.toString().gray}, ${thread.posts.count} ${
              `posts`.gray
            } /${thread.forum.id.cyan}/ ${thread.posts.items[0].title?.green}`
          );

          this.calculatePostStats(thread);

          const gptAnalyzer = await ChatOpenAI.new(
            Role.fromYamlFile(`./Analyzer.role.gpt.yaml`)
          );
          const gptNews = await ChatOpenAI.new(
            Role.fromYamlFile(`./News.role.gpt.yaml`)
          );
          const gptQuoter = await ChatOpenAI.new(
            Role.fromYamlFile(`./Quoter.role.gpt.yaml`)
          );

          // Sort posts by relevance (most relevant first)
          //const sentPosts = [...thread.posts.items];
          //sentPosts.sort((a: Post, b: Post) => b.relevance - a.relevance);

          // OpenAI's token limit is shorter than the average 4chan thread
          let sentPosts = [...thread.posts.items];
          // Take the first 3 posts
          const firstPosts = sentPosts.slice(0, 3);
          // Take the rest on the posts
          const restPosts = sentPosts.slice(3);
          // Sort posts by length (longest first)
          restPosts.sort((a: Post, b: Post) => b.length - a.length);
          // Take the first posts and the rest are sorted by length
          sentPosts = [...firstPosts, ...restPosts];

          // To GPT we're sending in this format:
          // [post text]
          // (4 replies)
          let gptPosts = sentPosts.map(this.gptifyPost.bind(this)) as string[];

          console.log(`Analyzing..`.gray);
          console.log(`  Analyzing..`.gray);
          const analysis = (
            await gptAnalyzer.sendSeveral(gptPosts, 600)
          ).parseJSON() as any;
          console.log(`  Generating article..`.gray);
          let newsArticle = await gptNews.sendSeveral(gptPosts, 1000);
          // Remove short sentences
          const paragraphs = newsArticle
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 60);
          newsArticle = paragraphs.join("\n\n");

          const keywords = analysis.keywords;
          const scores = analysis.scores;
          delete analysis.keywords;
          delete analysis.scores;
          analysis.entity = analysis.entity || null;
          analysis.article = newsArticle;
          thread.analysis = analysis;
          thread.keywords = keywords;
          thread.scores = scores;
          thread.analysis.article = newsArticle;
          this.db.upsert("Threads", thread);

          console.log(`  Finding quotes..`.gray);
          const quotes = (
            (await gptQuoter.sendSeveral(gptPosts, 600)).parseJSON() as any
          ).quotes;

          thread.quotes = quotes;
          this.db.upsert("Threads", thread);
        } catch (ex: any) {
          console.log(ex.toString().bgRed.black);
          thread.analysis = { error: true } as any;
          this.db.upsert("Threads", thread);

          this.db.upsert("Errors", {
            dt: Date.now(),
            thread: { _id: thread._id },
            error: ex.toString(),
          });
        }
      }
    }
  }

  // Set post.replies.from and to for each post in the thread
  // Set relevance score for each post
  private calculatePostStats(thread: Thread) {
    let posts = thread.posts.items;

    // Create a map of id => post
    const postsMap = new Map<number, Post>();
    for (const post of posts) {
      postsMap.set(post.id, post);
    }

    // Set post.length
    for (const post of posts) {
      post.length = this.getPostText(post).length;
    }

    // Initialize post.replies.from and to
    for (const post of posts) {
      post.replies = (post.replies || { from: [], to: [] }) as any;
    }

    // Set post.replies.to (and from)
    for (const post of posts) {
      // Get all >>91995453 ids from the post comment
      post.replies.to =
        post.comment
          ?.stripHtmlTags()
          ?.decodeHtml()
          ?.match(/>>\d+/g)
          ?.map((s) => s.replace(">>", ""))
          ?.map((s) => parseInt(s)) || [];

      // In the "to" post, add this post id to the "from" list
      for (const id of post.replies.to) {
        const p = postsMap.get(id);
        if (p) p.replies.from.push(post.id);
      }
    }

    // Set post.replies.from and post.replies.to to unique values
    for (const post of posts) {
      post.replies.from = [...new Set(post.replies.from)];
      post.replies.to = [...new Set(post.replies.to)];
    }

    // Calculate the mean length and mean number of replies for all posts
    const meanLength =
      posts.reduce((acc, post) => acc + post.length, 0) / posts.length;
    const meanReplies =
      posts.reduce((acc, post) => acc + post.replies.from.length, 0) /
      posts.length;

    // Assign a relevance score to each post
    for (var i = 0; i < posts.length; i++) {
      const post = posts[i];
      post.relevance = this.getRelevanceScore(post, i, meanLength, meanReplies);
    }

    // Normalize the relevance scores to ensure they fall within the range of 0.0 to 1.0
    const maxScore = Math.max(...posts.map((p) => p.relevance));
    for (var i = 3; i < posts.length; i++) {
      const post = posts[i];
      const normalizedScore = post.relevance / maxScore;
      post.relevance = normalizedScore;
    }
  }

  // Get the relevance score for a post
  // This is a weighted average of the length of the post and number of replies to it
  private getRelevanceScore(
    post: Post,
    index: number,
    meanLength: number,
    meanReplies: number
  ) {
    if (index < 3) {
      return 1.0; // First three posts get a score of 1.0
    } else {
      // Calculate the relative length and replies scores
      const lengthScore = post.length / meanLength;
      const replyScore = post.replies.from.length / meanReplies;

      // Calculate the weighted average of the length and replies scores
      const weightedScore = lengthScore * 0.4 + replyScore * 0.6;

      return weightedScore;
    }
  }

  // Remove HTML tags
  private gptifyPost(post: Post) {
    let p = Objects.json.parse(JSON.stringify(post)) as Post;
    p.title = this.gptifyText(p.title);
    p.comment = this.gptifyText(p.comment);
    let s = this.getPostText(p);
    return s;
  }

  private getPostText(post: Post) {
    let texts = [post.title, post.comment];
    texts = texts.filter((s) => s);
    return texts.join("\n");
  }

  private gptifyText(text: string) {
    if (!text) return text;

    // Remove HTML tags
    text = text?.stripHtmlTags().decodeHtml();

    // Remove quote links (>>91995453)
    //text = text.replace(/>>\d+/g, "");

    // Trim lines
    text = text
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s)
      .join("\n");

    // Trim spaces
    text = text.trim();

    // Get only words
    //text = text.getWords().join(" ");

    return text;
  }
}

export { Summarizer };
