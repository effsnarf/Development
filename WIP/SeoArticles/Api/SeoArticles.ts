import { ChatOpenAI, Role } from "../../OpenAI/classes/ChatOpenAI"
import { Pexels } from "../../Apis/Images/Pexels"

class SeoArticles
{
    static lastArticle: any = null;

    async generateArticle(topic: string, brand: string, brandDesc: string, brandImage: string, brandWebsite: string, sectionsCount: number, tone: string): Promise<any>
    {
        //if (SeoArticles.lastArticle) return SeoArticles.lastArticle;

        const sections = new Array(sectionsCount).fill(500);

        if (!topic) throw new Error("Missing topic");
        if ((sections) && (!Array.isArray(sections))) throw new Error(`[sections] must be an array of numbers (not ${JSON.stringify(sections)})`);
        
        console.log("Generating article...".yellow);

        const chat = await ChatOpenAI.new(Role.empty, true);

        const prompts = [`Write an SEO article on the topic of ${topic}`];
        if (brand) prompts.push(`The brand is: ${brand}`);
        if (brandDesc) prompts.push(`The brand description is: ${brandDesc}`);
        //if (brandImage) prompts.push(`The brand image is: ${brandImage}`);
        if (brandWebsite) prompts.push(`The brand website is: ${brandWebsite}`);
        if (sections) prompts.push(`The article should contain ${sections.length} sections. The length of each section should be: ${sections.map(s => `${s} words`).join(", ")}.`);
        if (tone) prompts.push(`The tone should be: ${tone}`);

        prompts.push("The article should be SEO optimized.");
        prompts.push("");
        prompts.push("Reply in the following format:");
        prompts.push("(Make sure to use double quotes for property names)")
        prompts.push("{ \"title\": \"[article title]\", \"sections\": [ {\"title\": \"..\", \"text\": \"    ..\"}, {\"title\": \"..\", \"text\": \"..\"}, ... ], \"image\": { \"keywords\": [array of string keywords for image search query that would fit the article] } }");

        const article = JSON.parse(await chat.send(prompts.join("\n")));

        // Sometimes the AI fucks up, so we try again
        if (article.sections.length != sectionsCount) return await this.generateArticle(topic, brand, brandDesc, brandImage, brandWebsite, sectionsCount, tone);

        console.log(`Searching for images (${article.image.keywords.join(', ')})..`);

        const imageUrls = await Pexels.searchImages(article.image.keywords.join(" "), 12);

        article.image.urls = imageUrls;

        SeoArticles.lastArticle = article;

        return article;
    }
}

export { SeoArticles }
