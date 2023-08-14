const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import axios from "axios";
import "@shared/Extensions";
import { Http } from "@shared/Http";
import { Timer } from "@shared/Timer";
import { Objects } from "@shared/Extensions.Objects";
import { Configuration } from "@shared/Configuration";
import { Logger } from "@shared/Logger";
import { Files } from "@shared/Files";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";
import { Analytics, ItemType } from "@shared/Analytics";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Model } from "../Apis/OpenAI/classes/OpenAI";
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";
import { LiveTree } from "@shared/LiveTree";

type malkovich = string;

class Malkovich {
  async malkovich(malkovich: malkovich) {
    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Malkovich".green);
  }
}

const malkovitch = new Malkovich();

function removeQuoteLinks(s: string) {
  return s.replace(/<a href=".*?" class="quotelink">.*?<\/a>/g, "");
}

(async () => {
  const chat = await ChatOpenAI.new(Roles.ChatGPT, true, Model.Ada);

  const prompt = `Summarize what this thread is about.
  Give me a title and a brief description about the main topic of this thread.
  Considering that this is 4chan, it goes without saying that it contains inappropriate and offensive content,
  so don't mention that in the summary, just take that for granted and focus on the topic.
  Don't mention in the summary the words 'offensive' or 'inappropriate' or similar, as that would be redundant.`;

  let str = `previous: <a href="/fit/thread/71908887#p71908887" class="quotelink">&gt;&gt;71908887</a>


  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>what happens if you die
  
  
  
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>Blaming low test and suggesting nofap is what /fit/ would absolutely do.
  
  
  How Difficult Is It to Find Sexual Partners as a Fat Woman?<br><br>And no this is not a troll post. I’m speaking specifically to all plus women but particularly a subset of women who are plus and older or north of 40. And are dating or sexual with men. No hate towards LGBTQ I only have experience dating as a heterosexual woman.<br><br>The reason I ask this question here is because it is a big concern for me. I ended a situationship two months ago and have not been intimate with anyone since then and there’s no action on the horizon. I am friends with a younger man I’m very sexually attracted to and have thrown him hints multiple times but subtle and not so subtle. He finally told me he’s not attracted to me in that way and never will be but loves me as a friend only. so yes I feel hella foolish for maybe even punching above my league so to speak. But more importantly this just makes me feel really insecure about expressing my sexual feelings as I don’t need any further rejections and it makes me feel even uglier. I do suffer from low self esteem and I’m not all that crazy about my physical appearance. And yes I have good hygiene make up clothes all that stuff.<br><br>Anyway what experiences have any larger older plus size ladies had in terms of finding respectful relationships or sexual partners? I just feel like no one will be attracted to me. I am a domestic violence survivor and I’ve had some really awful experiences with partners I was attracted to only wanting to be around me not because they liked me but for financial gain or other reasons. I’d really like to meet a partner who is attracted to just me physically and mentally but I feel like my outside packaging ;appearance) is making it impossible to find that.<br>For reference I’m apple shaped ( big boobs, not a huge stomach but it’s not flat ) some booty but probably not enough I’m very large at 250 pounds and I’m 5 ft 1. I also wear my hair short and I’m a black woman.<br><br>Anyway not sure what to do .
  
  
  <a href="#p71922124" class="quotelink">&gt;&gt;71922124</a><br>Are you suggesting gear and abstinence wouldn&#039;t work?
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>finally got around to watching this, couldn&#039;t stop laughing<br>it&#039;s like a fucking /fph/ greentext
  
  
  <a href="#p71922135" class="quotelink">&gt;&gt;71922135</a><br>They might not make me want to have sex with the woman of the story. On the contrary, they would probably make me leave her. Been there in a passionless relationship with an overweight girl and it didn&#039;t work out than a few months. Tried twice with her, because she was otherwise wife material and the failure was as much me as it was her.
  
  
  
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br><span class="quote">&gt;I’m very large at 250 pounds and I’m 5 ft 1. </span><br><span class="quote">&gt;I’m a black woman.</span><br>It&#039;s over
  
  
  <a href="#p71922152" class="quotelink">&gt;&gt;71922152</a>
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br><span class="quote">&gt;250 pounds and I’m 5 ft 1</span><br>what would this look like in person?
  
  
  https://www.youtube.com/watch?v=prt<wbr>K9KYgXfc&amp;t=158s
  
  
  <a href="#p71922268" class="quotelink">&gt;&gt;71922268</a>
  
  
  <a href="#p71922291" class="quotelink">&gt;&gt;71922291</a><br>First spongebob image
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br>Miss,excuse me for asking,but aren&#039;t you ashamed of dropping hints while looking like a fucking subhuman?
  
  
  <a href="#p71922431" class="quotelink">&gt;&gt;71922431</a><br>That&#039;s racist, fatphobic and misogynistic<br>I am gonna message the moderators and tell them to ban you
  
  
  
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>just eat sugar instead of this workout
  
  
  
  
  
  
  
  
  I absolutely love body positivity but I also love a comfy and fashionable top that hides my mom tummy
  
  
  <a href="#p71922152" class="quotelink">&gt;&gt;71922152</a><br><span class="quote">&gt;break into middle management roles</span><br>I didn&#039;t know fatties had it this bad.
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br><span class="quote">&gt;not a huge stomach</span><br><span class="quote">&gt;250 pounds</span><br><span class="quote">&gt;5 ft 1</span><br>This sounds delusional
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br><a href="#p71922620" class="quotelink">&gt;&gt;71922620</a><br>It&#039;s always impressive to me how androgynous people are when they&#039;re obese amorphous blobs.
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>This one isn&#039;t motivating, it just made me sad for her poor choices and sad life.
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>This one&#039;s positive attitude shtick is exceptionally annoying. Coffee addicts are drug addicts.
  
  
  <a href="#p71922885" class="quotelink">&gt;&gt;71922885</a><br><span class="quote">&gt;bad choices</span><br><span class="quote">&gt;everything bad in her life stems from being fat</span><br>it’s just the one choice, really
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br>Wow, imagine two whole months without sex haha
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>Non alcoholic spirit. Literally fucking whyyyyy
  
  
  <a href="#p71923233" class="quotelink">&gt;&gt;71923233</a><br>it&#039;s a fix, not a alcoolic fix, but a sugary fix, those are worst to get rid of
  
  
  <a href="#p71922278" class="quotelink">&gt;&gt;71922278</a><br>Certified woman moment
  
  
  <span class="quote">&gt;be me</span><br><span class="quote">&gt;fat</span><br><span class="quote">&gt;238lbs</span><br><span class="quote">&gt;5&#039;8 manlet king</span><br><span class="quote">&gt;cruising on 3400kcal average</span>
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br><span class="quote">&gt;Both kids are &quot;neurodivergent&quot;</span><br>Remember anons...even if you can tolerate her weight, it WILL be a problem. Also why is it always women who do this, just lose the fucking weight like damn.
  
  
  <a href="#p71923459" class="quotelink">&gt;&gt;71923459</a><br><span class="quote">&gt;I need his help with my son</span><br>why are women like this. they never write &#039;our son&#039; they act like the man has no relation to her son. he&#039;s just there to facilitate whatever is convenient for her<br><span class="quote">&gt;asian</span><br><span class="quote">&gt;40</span><br><span class="quote">&gt;unattractive</span><br>the game was rigged in her favour and she still fucked up
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br><span class="quote">&gt;SPICE 94</span><br><span class="quote">&gt;$31.99</span><br><span class="quote">&gt;A warm, aromatic blend of Allspice &amp; Cardamom with fresh citrus top notes to balance the long bitter finish. 1 x 23.7 fl oz / 700 ml bottle. 1 bottle of Seedlip makes 12-14 cocktails.</span><br>4$ in non alcoholic spirits alone for a reeses cappuccino? This is why i will NEVER respect a fat &quot;person&quot;. This is why i dont respect anybody that goes on strike
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br><span class="quote">&gt;that pic</span><br><span class="quote">&gt;the reply at the bottom</span><br>lmao somebody took the &quot;high test&quot; meme seriously.
  
  
  
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>https://en.wikipedia.org/wiki/Irrit<wbr>able_male_syndrome
  
  
  <a href="#p71922105" class="quotelink">&gt;&gt;71922105</a><br>It would be very painful
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  medically murder
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>This is up there for one of the worst things I&#039;ve ever read
  
  
  
  
  
  
  
  
  How is it that I can live tranquilly on two meals a day as a 6’2” man while you have these fatties constantly stuffing their faces and consuming garbage. What is their secret?
  
  
  <a href="#p71923778" class="quotelink">&gt;&gt;71923778</a><br>sugar addiction + dopamine trap
  
  
  
  
  
  <a href="#p71923646" class="quotelink">&gt;&gt;71923646</a><br>desu senpai it is infuriating. I don&#039;t begrudge the existence of fat chicks but I can&#039;t abide their having high self-esteem<br>personally I blame thirsty weak men
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a>
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>You know, I&#039;m gonna go out on a limb and say his obesity isn&#039;t the problem here
  
  
  
  
  
  
  
  
  <a href="#p71923933" class="quotelink">&gt;&gt;71923933</a><br>Imagine not getting it this badly
  
  
  <a href="#p71923883" class="quotelink">&gt;&gt;71923883</a><br>Who&#039;s the criminal in this picture?
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br><span class="quote">&gt;horny asian milf with a big ass wants your dick</span><br>Imagine not fucking her. How do guys even get this low-test?
  
  
  <a href="#p71923997" class="quotelink">&gt;&gt;71923997</a><br>This is why fat women exist today, because men will still fuck them when they&#039;re fat<br>STOP<br>*clap*<br>FUCKING<br>*clap*<br>FAT<br>*clap*<br>WOMEN
  
  
  <a href="#p71924006" class="quotelink">&gt;&gt;71924006</a><br><span class="quote">&gt; *clap*</span><br>are you a negro?
  
  
  <a href="#p71922768" class="quotelink">&gt;&gt;71922768</a><br>They run (hehe) hr. It&#039;s all fatties and xirs.
  
  
  <a href="#p71923638" class="quotelink">&gt;&gt;71923638</a><br>Guess she pressed pause on being alive
  
  
  <a href="#p71923997" class="quotelink">&gt;&gt;71923997</a><br>You on hormone blockers or some shit?<br>Men fuck their wives.
  
  
  <a href="#p71923992" class="quotelink">&gt;&gt;71923992</a><br>the guy not in a dress shirt and tie
  
  
  <a href="#p71922170" class="quotelink">&gt;&gt;71922170</a><br><span class="quote">&gt;it’s ogre</span><br>FIFY
  
  
  <a href="#p71923933" class="quotelink">&gt;&gt;71923933</a><br>Behold! The reason fat guys change and fat women don&#039;t. Men don&#039;t have a choice, but there&#039;s always some gross fucking excuse of a male willing to be a slam pig rider.
  
  
  sexy
  
  
  <a href="#p71923574" class="quotelink">&gt;&gt;71923574</a><br>why is the phrase &quot;look like me&quot; so annoying? it&#039;s like nails on a chalkboard to read/hear
  
  
  <a href="#p71923997" class="quotelink">&gt;&gt;71923997</a><br>Guarantee you look like shit and have garbage lifts and that&#039;s why you cling to the idea that having no standards for what you put your dick in makes you &quot;high test&quot; despite having no other attributed hinting towards it.<br>Feel free to post body to prove me wrong, but you won&#039;t.
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>this is what her toilet looks like
  
  
  <a href="#p71923819" class="quotelink">&gt;&gt;71923819</a><br>LMAO
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>This is the same person that made the monstrosity with the Toblerone bar. Now that s/he has shed the winter clothing, they resemble less a baby and look more like the bull-dykes that masquerade as Lutheran ministers in ELCA churches.<br><br><span class="quote">&gt;non-alcoholic spirits</span><br>Get thee behind me, Satan!<br>Demons of lust! I command thee, OUT!<br>Demons of sloth! I command thee, OUT!<br>Demons of gluttony! I command thee, OUT!<br>Demons of bad taste! I command thee, OUT!
  
  
  <a href="#p71922644" class="quotelink">&gt;&gt;71922644</a><br>I tell students that they are going to get cancer and diseases if they don&#039;t exercise
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>Holy shit, imagine choosing this from childhood. Every fucking day slipping further down that slippery slope of needless disability due to terrible life choices. <br><br><span class="quote">&gt;2 neurodivergent kids</span><br>At this point one would almost start to think this is a troll/bait but honk honk, welcome to the current year.
  
  
  <a href="#p71924216" class="quotelink">&gt;&gt;71924216</a><br>That thing is a her?<br>Also kek.
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br><span class="quote">&gt;without my wife and children (for whatever reason, they haven&#039;t accompanied me)</span><br>Well that reason would be they don&#039;t exist. Far from ruining some poor victims life by intentionally disabling him/her and keeping him/her as a pet, this blob is disabling himself through morbid obesity. <br><br>If this is not just some troll putting an unrelated text next to a picture of some oddly dressed/groomed fatso this man should really be killed ASAP. How much more clear does the treat he poses to normal people need to be made? If he were physically able he&#039;d do monstrous things, he supposedly writes so himself.
  
  
  <a href="#p71923665" class="quotelink">&gt;&gt;71923665</a><br><span class="quote">&gt;If I happen to get hospitalized with COVID (AS MANY DO WHO FIT STEREOTYPICAL &#039;HEALTHY&#039; SHIT)</span><br>Uhh no, covid was about as dangerous as the seasonal flu to young healthy people. Which is to say not at all except for extremely rare freak outlier cases. Think Final Destination type unlikely occurrences.
  
  
  <a href="#p71923651" class="quotelink">&gt;&gt;71923651</a><br>I mean, true i guess. I dont really care about the health of random fat people I dont know, I care about how ugly the aesthetic is. Though canadian healthcare.. so I do care to the extent I care about my own wallet and the general doctor supply/demand issues here
  
  
  <a href="#p71924398" class="quotelink">&gt;&gt;71924398</a><br><span class="quote">&gt;I care about how ugly the aesthetic is.</span><br>Based.<br>Having a beautiful/aesthetic environment and surroundings is paramount.
  
  
  <a href="#p71924393" class="quotelink">&gt;&gt;71924393</a><br>This. And the people old enough to be hurt by it were already retired. So we shut down the country and destroyed the economy for fat people.
  
  
  <a href="#p71924540" class="quotelink">&gt;&gt;71924540</a><br><span class="quote">&gt;So we shut down the country and destroyed the economy for fat people.</span><br>No we did it to justify a massive money laundering scheme and inflation trigger to avert a depression wiping out the wealth of (((elites))) with the side effect of getting nationalists out of public office and creating a pretext for further erosion of civil liberties with a dash of genocide via clotshot<br>The fat and old people are just a scapegoat, not that they are morally absolved from their fatness and/or oldness
  
  
  <a href="#p71924540" class="quotelink">&gt;&gt;71924540</a><br><a href="#p71924574" class="quotelink">&gt;&gt;71924574</a><br><span class="quote">&gt;this is now a covid thread</span><br>Man fuck off and post fat retards
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>Who gave Dr Moreau internet access
  
  
  <a href="#p71922115" class="quotelink">&gt;&gt;71922115</a><br>Damn I need some of these unlimited energy pills.<br>Who needs a dyson sphere?
  
  
  <a href="#p71923933" class="quotelink">&gt;&gt;71923933</a><br>He has the same height as me. Men can only afford to be fat if they&#039;re tall. I don&#039;t know a single fatty around my height or lower who has a gf.<br><br><a href="#p71923949" class="quotelink">&gt;&gt;71923949</a><br>Ex fatty here and can confirm. Was completely invisible until I lost most of the weight. <br><br><a href="#p71924141" class="quotelink">&gt;&gt;71924141</a><br>This. Men let themselves go once they settled down. Women get fat early because they have no trouble getting laid even if they happen to be landwhales.
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>Of course it&#039;s the man&#039;s fault<br> It always is, isn&#039;t it.
  
  
  I love this pink floral summer dress, with my height it&#039;s hard to find one that&#039;s full length on me!
  
  
  <a href="#p71923574" class="quotelink">&gt;&gt;71923574</a><br>This low effort shit is even signed. The parallels between narcissism and obesity are obvious.
  
  
  Felt pretty good today,what do you think?<br>Top from jacamo Trousers from badrhino
  
  
  <a href="#p71923883" class="quotelink">&gt;&gt;71923883</a><br>This guy is going to get fucked up in prison once they find what hes in for
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>/fit/ has yet to refute this.
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>Wow. That was not a good read.
  
  
  <a href="#p71923772" class="quotelink">&gt;&gt;71923772</a><br>the skin makes me think that this guy managed to lose a fuckton of weight at some point and hence, was probably twice as big as he is now
  
  
  <a href="#p71922278" class="quotelink">&gt;&gt;71922278</a><br>they were called because she was suicidal, this was suicide by cop
  
  
  <a href="#p71923819" class="quotelink">&gt;&gt;71923819</a><br>Looks like Chris Chan
  
  
  <a href="#p71922762" class="quotelink">&gt;&gt;71922762</a><br>not fph, stay on topic retard
  
  
  <a href="#p71925029" class="quotelink">&gt;&gt;71925029</a><br>you are right
  
  
  fat goths :CCCCCCCC
  
  
  <a href="#p71924654" class="quotelink">&gt;&gt;71924654</a><br>lmao
  
  
  pretty face at least
  
  
  
  
  
  
  
  
  <a href="#p71925146" class="quotelink">&gt;&gt;71925146</a><br><a href="#p71925175" class="quotelink">&gt;&gt;71925175</a><br><a href="#p71925188" class="quotelink">&gt;&gt;71925188</a><br>can you fuck off with this shit?
  
  
  <a href="#p71925206" class="quotelink">&gt;&gt;71925206</a><br>no, they make me feel skinny. can you suck my cock?
  
  
  
  
  
  <a href="#p71925218" class="quotelink">&gt;&gt;71925218</a><br>fag
  
  
  Do you watch any YouTubers that talk about fat activism? I watch Think Before You Sleep
  
  
  <a href="#p71925230" class="quotelink">&gt;&gt;71925230</a><br>you&#039;re damn right.how tight is your balloon knot?
  
  
  intentional weight gain is the worst imo
  
  
  <a href="#p71925260" class="quotelink">&gt;&gt;71925260</a>
  
  
  <a href="#p71925268" class="quotelink">&gt;&gt;71925268</a><br>shes an actual blob
  
  
  
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br><span class="quote">&gt;250 pounds</span><br>There is no height a woman could be to make this work.<br>By the time this weight would look good they&#039;d be too tall to look reasonably human.<br><br>Also, you entitled bitch, aaww 2 mk ths without sex? Women are such fucking children.<br><br>Also this post isn&#039;t real. There&#039;s no 5&#039; 1&quot;, death fat, midget, 47.2 BMI havin&#039; black women posting on /fit/.
  
  
  <a href="#p71922152" class="quotelink">&gt;&gt;71922152</a><br><a href="#p71922247" class="quotelink">&gt;&gt;71922247</a><br>They&#039;re probably incredibly lazy and perform horribly.<br><br>AND everytime they fuck something up YOU JUST KNOW they&#039;re making excuses I strad taking accountability for themselves just like they do for their weight.
  
  
  <a href="#p71925365" class="quotelink">&gt;&gt;71925365</a><br><span class="quote">&gt;Also this post isn&#039;t real. There&#039;s no 5&#039; 1&quot;, death fat, midget, 47.2 BMI havin&#039; black women posting on /fit/.</span><br>no shit, he obviously just brought back a post from reddit, he even included the title, he wasn&#039;t trying to trick you at all
  
  
  <a href="#p71923646" class="quotelink">&gt;&gt;71923646</a><br>If the average /fit/izen had the [undeserved] confidence of a fat chick this board would have conquered the known universe by now.
  
  
  <a href="#p71923819" class="quotelink">&gt;&gt;71923819</a><br>I was expecting it to end with a picture of Pierce Brosnan.
  
  
  This thing claimed to be over 400 pounds at some point. At 5&#039;4&quot;, its bmi would be around 70.
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br><span class="quote">&gt;&quot;h*ck it all</span>
  
  
  <a href="#p71924155" class="quotelink">&gt;&gt;71924155</a><br><span class="quote">&gt;not fucking your woman because of standards or some shit</span><br>Limp dick beta bitch boy.
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>Sometimes I wonder why God doesn&#039;t talk to us anymore, and then I see shit like this and suddenly it all makes sense.
  
  
  <a href="#p71925596" class="quotelink">&gt;&gt;71925596</a><br><span class="quote">&gt;no body post</span><br>Thanks for proving me right, as if there was any doubt. <br>Chubby chasers are the lowest test faggots on /fit/.
  
  
  been doing portion control for a couple weeks and feeling better. Then I spent all day yesterday ravenously overeating. No clue why, started with high volume foods and ended with mcdonalds. Hpw do you prevent/ control these binge cravings? All I can think of is getting on a daily multi incase its some mineral or micronutrient im lacking
  
  
  lmao this dude from earlier in the thread thinks he&#039;s not big and whines about the dating scene
  
  
  <a href="#p71925614" class="quotelink">&gt;&gt;71925614</a><br>My nigga in Christ, overeating is just like any other addiction: it&#039;s a sign of something else going wrong in your life.<br>Think about what might have happened yesterday that would have negatively affected you and forced you into a negative behaviour. Sometimes you can&#039;t put your finger on one thing and know it was just a general negative mood, which will often happen for any number of reasons. You&#039;ve just got to stay strong for 30 minutes and the craving will usually go away.
  
  
  <a href="#p71925649" class="quotelink">&gt;&gt;71925649</a><br>Appreciate it, king.Been trying to stay in a calorie deficit and doing the heavy duty program. Guess theres no point in taking a single day personally. Cant throw the whole thing out because I fucked up once
  
  
  <a href="#p71923638" class="quotelink">&gt;&gt;71923638</a><br><span class="quote">&gt;Massey University</span><br>Pottery
  
  
  <a href="#p71924247" class="quotelink">&gt;&gt;71924247</a><br>What&#039;s his routine
  
  
  <a href="#p71925613" class="quotelink">&gt;&gt;71925613</a><br>You really want to see my body that badly? Gaywad.
  
  
  <a href="#p71925558" class="quotelink">&gt;&gt;71925558</a><br><span class="quote">&gt;age 23</span>
  
  
  <a href="#p71925558" class="quotelink">&gt;&gt;71925558</a><br>what the hell? looks like literally anyone can model now. she looks like someone&#039;s fat 13 year old brother
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>I still find that fatso larping as the monopoly man more disturbing than that 2spoopy wall of text
  
  
  <a href="#p71924796" class="quotelink">&gt;&gt;71924796</a><br>Trannies would fare a lot better if their body dysmorphia was just plain old anorexia instead of just wanting to chop their dick off
  
  
  <a href="#p71925738" class="quotelink">&gt;&gt;71925738</a><br>swimming + calf raises, absolutely nothing else
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a>
  
  
  
  
  
  You&#039;re the one for me, fatty<br>You&#039;re the one I really, really love<br>And I will stay<br>Promise you&#039;ll say<br>If I&#039;m in your way<br>You&#039;re the one for me, fatty<br>You&#039;re the one I really, really love<br>And I will stay<br>Promise you&#039;ll say<br>If I&#039;m ever in your way<br>A-hey<br>All over Battersea<br>Some hope and some despair<br>All over Battersea<br>Some hope and some despair<br>Oh...<br><br>You&#039;re the one for me, fatty<br>You&#039;re the one I really, really, love<br>And I will stay<br>Promise you&#039;ll say<br>If I&#039;m in your way<br>You&#039;re the one for me, fatty<br>You&#039;re the one I really, really love<br>And I will stay<br>Promise you&#039;ll say<br>If I&#039;m ever in your way<br>A-hey<br><br>All over Battersea<br>Some hope and some despair<br>All over Battersea<br>Some hope and some despair<br>Oh, oh...<br><br>You&#039;re the one for me, fatty<br>You&#039;re the one I really, really love<br>And I will stay<br>Promise you&#039;ll say<br>If I&#039;m ever in your way<br>A-hey<br>You&#039;re the one for me, fatty<br>You&#039;re the one for me, a-hey-hey<br>A-hey<br>A-hey<br>A-hey<br>A-he-he-he-hey
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>2edgy4me
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>a 2 second crop and filter turns a severely autistic virgin loser into a humble 1940’s train conductor with a lovely chubby wife who was rejected to go to war cause of his weight but still does his part :)
  
  
  <a href="#p71923599" class="quotelink">&gt;&gt;71923599</a><br>man that shit looks like some of those &quot;Hoax Wikipedia Articles&quot; that some random fuckasses made and nobody found out for about a decade or something
  
  
  <a href="#p71922145" class="quotelink">&gt;&gt;71922145</a><br>Movie made me physically ill
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a>
  
  
  <a href="#p71925599" class="quotelink">&gt;&gt;71925599</a><br>Oh, he&#039;ll be stopping by soon enough, OT style.
  
  
  <a href="#p71923672" class="quotelink">&gt;&gt;71923672</a><br>Thanks for the warning anon, I like this site but hate some of the shit on here
  
  
  <a href="#p71924024" class="quotelink">&gt;&gt;71924024</a><br>We don&#039;t talk like that around here bud
  
  
  <a href="#p71926273" class="quotelink">&gt;&gt;71926273</a><br>art thou an nigger?
  
  
  <a href="#p71926202" class="quotelink">&gt;&gt;71926202</a><br>lol that reminds me of the tourettes guy eating the corndog<br><span class="quote">&gt;i heard she was a lesbian...</span><br><span class="quote">&gt;THAT JUST MEANS SHE LIKES WHAT I LIKE</span>
  
  
  <a href="#p71925596" class="quotelink">&gt;&gt;71925596</a><br><span class="quote">&gt;not wanting your mate to die before they turn 50</span>
  
  
  <a href="#p71926011" class="quotelink">&gt;&gt;71926011</a><br>I like how this is vague enough to where fat people or healthy people could agree with it, great meme
  
  
  <a href="#p71926289" class="quotelink">&gt;&gt;71926289</a><br>I Am what I Am
  
  
  <a href="#p71926273" class="quotelink">&gt;&gt;71926273</a><br>GET<br>*clap*<br>OFF<br>*clap*<br>4CHAN<br>*clap*<br>YOU<br>*clap*<br>FAT<br>*clap*<br>RETARD<br><br>its so gay how people on THIS cesspool of a site feel some sort of community, and like its up to them to uphold the site&#039;s unspoken rules lol. sad lonely faggots
  
  
  <a href="#p71926011" class="quotelink">&gt;&gt;71926011</a><br><span class="quote">&gt;worshipping your hunger hormones like they&#039;re some sentient deity</span><br><br>Do fatties really? They don&#039;t know you can manipulate or ignore those signals?
  
  
  cant believe i have to artificially stimulate my appetite with pharmajew and some people are just born bottomless fucking holes
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>Usually, those insane milkshakes or drinks end up looking at least remotely tasty, even despite diabetes and unnecessarily making the cup stinky with whatever.<br>But this just looks like shit, I&#039;d rather have a normal coffee with creme.
  
  
  <a href="#p71922268" class="quotelink">&gt;&gt;71922268</a>
  
  
  <a href="#p71925558" class="quotelink">&gt;&gt;71925558</a><br><span class="quote">&gt;9 womans </span><br>Xaam, we were asking for your shoe size, not your weight
  
  
  <a href="#p71926011" class="quotelink">&gt;&gt;71926011</a><br>I tried intuitive drinking, and it ruined my life. I see plenty of homeless doing intuitive smoking and injecting, and they don&#039;t look so good.
  
  
  <a href="#p71924393" class="quotelink">&gt;&gt;71924393</a><br><span class="quote">&gt;Uhh no, covid was about as dangerous as the seasonal flu to young healthy people</span><br>Lmao okay cultist
  
  
  <a href="#p71924141" class="quotelink">&gt;&gt;71924141</a><br><span class="quote">&gt;there&#039;s always some gross fucking excuse of a male willing to be a slam pig rider</span><br>Isnt this common sense by now?
  
  
  <a href="#p71922919" class="quotelink">&gt;&gt;71922919</a><br>That&#039;s like 95% sugar. I doubt it can taste any coffee in that sludge.
  
  
  <a href="#p71926889" class="quotelink">&gt;&gt;71926889</a><br>i got covid twice. it was literally a cold/flu. and then it was gone and i forgot about it. i only knew it was covid because i had some freebie testers
  
  
  <a href="#p71926057" class="quotelink">&gt;&gt;71926057</a><br>am i fag for liking morrissey?
  
  
  <a href="#p71927467" class="quotelink">&gt;&gt;71927467</a><br>you are a fag for liking cock
  
  
  shut up about covid
  
  
  anyone else feel like fph focuses mainly on the morbidly obese and not just regular fat fucks like 25% bodyfat
  
  
  <a href="#p71923992" class="quotelink">&gt;&gt;71923992</a><br>kek
  
  
  <a href="#p71924654" class="quotelink">&gt;&gt;71924654</a><br><a href="#p71925163" class="quotelink">&gt;&gt;71925163</a>
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>its weird how so many fat people look like Paul Dano, which is weird because Paul Dano himself isn&#039;t fat at all
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>what the fuck did I just read
  
  
  Why are fat people always broke and how do they sustain themselves financially? <br> <br>I&#039;ve never once met a fat person who was financially successful. <br>Of course, out of shape billionaires exist. Trump or Musk aren&#039;t particularly fit. But i&#039;ve never seen one of those turbo-fatties that start to collapse on themselves, that can&#039;t even walk, richer than I am, and I&#039;m not even that rich. <br>how do they even survive? they&#039;re so unfit, physically and mentally, they can&#039;t even flip burgers. <br>Don&#039;t tell me my tax dollars are paying to keep these brokies on life support.
  
  
  <a href="#p71925558" class="quotelink">&gt;&gt;71925558</a><br><span class="quote">&gt;39” waist</span><br>Not a chance
  
  
  <a href="#p71922679" class="quotelink">&gt;&gt;71922679</a><br>That&#039;s kind of impressive considering he&#039;s likely moving over 600 pounds between the two of them.
  
  
  <a href="#p71923268" class="quotelink">&gt;&gt;71923268</a><br>Nigger have you ever read what severe alcohol withdrawal actually does to a person?
  
  
  <a href="#p71927665" class="quotelink">&gt;&gt;71927665</a><br>Gabe Newell, retard.
  
  
  <a href="#p71927665" class="quotelink">&gt;&gt;71927665</a><br>usually by guilt tripping friends and family. they are the ultimate leeches.<br><a href="#p71927782" class="quotelink">&gt;&gt;71927782</a><br>Gaben is still mobile
  
  
  
  
  
  <a href="#p71924654" class="quotelink">&gt;&gt;71924654</a><br>Incredibly blessed comment
  
  
  <a href="#p71923612" class="quotelink">&gt;&gt;71923612</a><br>for you
  
  
  <a href="#p71927491" class="quotelink">&gt;&gt;71927491</a><br><span class="quote">&gt;Just 25% bodyfat</span><br>How far the standards have fallen. It&#039;s true, but I think everyone, even us in this thread have become desensitised to fat lard arses.
  
  
  <a href="#p71922149" class="quotelink">&gt;&gt;71922149</a><br>Dipshit husband got baby trapped.
  
  
  <a href="#p71922247" class="quotelink">&gt;&gt;71922247</a><br>The refusal to climb stairs keeps you at the entry level.
  
  
  <a href="#p71923819" class="quotelink">&gt;&gt;71923819</a><br><span class="quote">&gt;I’m having a bad, bad day</span>
  
  
  Figured you gents would appreciate this...<br><br><span class="quote">&gt;live down the road from my parents</span><br><span class="quote">&gt;fat mom sends me this</span><br><br>And yes, I am American
  
  
  <a href="#p71924796" class="quotelink">&gt;&gt;71924796</a><br>That would look good on someone female and not a landwhale.
  
  
  <a href="#p71925146" class="quotelink">&gt;&gt;71925146</a><br>I feel that she likely owns a horse dildo.
  
  
  
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>If they sat next to my table I&#039;d decapitate him with the butter knife, just to hear him squeal like a pig.
  
  
  <a href="#p71923574" class="quotelink">&gt;&gt;71923574</a><br><span class="quote">&gt;I HOPE I&#039;M</span><br><span class="quote">&gt;bat</span><br><span class="quote">&gt;FOREVER</span>
  
  
  <a href="#p71927994" class="quotelink">&gt;&gt;71927994</a><br>Never ask why, no matter who it is. My mom would always ask if I was busy on whatever day. I’d say yes. She’d reply with, “okay…” I refused to ask why. State your fucking business. Also, if they do not state their business, the answer is always the opposite of what they want it to be, in my case, yes, I’m busy, regardless of what I’m doing.
  
  
  <a href="#p71928102" class="quotelink">&gt;&gt;71928102</a><br>It is an annoying behavior but she might be worried that she’s bothering you. Just say “what’s up” next time instead of “yes”
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br><span class="quote">&gt;men</span><br>be prefect and you might get laid<br><span class="quote">&gt;women</span><br>be obese and old and still get fucked<br><br>I want the simps to die
  
  
  <a href="#p71928121" class="quotelink">&gt;&gt;71928121</a><br>I assure you, she’s not worried about that. She wants to know if I’m busy so she can ask me to do something. I’m very happy to help my mom or most anyone. But state your business, don’t beat around the fucking bush. It’s like when a girl says she has a boyfriend when you ask her out. Maybe she does, maybe she doesn’t. She’s either telling the truth or letting you down nicely. If you just ask her if she has a boyfriend, she might say no, and now might feel bad when she declines you for a date. But that’s what you’re banking on, so it’s manipulative. Same thing here, if you try to trick me into helping you, I’m not inclined to do so.
  
  
  <a href="#p71923651" class="quotelink">&gt;&gt;71923651</a><br><a href="#p71924398" class="quotelink">&gt;&gt;71924398</a><br>I&#039;ve got it I&#039;ve got it<br>googled the opposite of -philia<br>apparently it&#039;s -misia<br>we all have fatmisia
  
  
  <a href="#p71928165" class="quotelink">&gt;&gt;71928165</a><br>That&#039;s easy to fix, just put up signs around town saying &#039;looking for a boyfriend free girlfriend&#039;
  
  
  <a href="#p71924024" class="quotelink">&gt;&gt;71924024</a><br>No negro would want to stop fucking fat women
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>They’re just two heckin consenting adults, y’all stop kink shaming
  
  
  <a href="#p71927861" class="quotelink">&gt;&gt;71927861</a><br><a href="#p71927491" class="quotelink">&gt;&gt;71927491</a>
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br><span class="quote">&gt;Mom thought I could never get pregnant</span><br><span class="quote">&gt;I got pregnant right away both times</span><br><span class="quote">&gt;and had two mr kids</span><br>Fucking clown world
  
  
  <a href="#p71927926" class="quotelink">&gt;&gt;71927926</a><br>Lel good one
  
  
  <a href="#p71924574" class="quotelink">&gt;&gt;71924574</a><br><span class="quote">&gt;be anti-semite</span><br><span class="quote">&gt;be schizo</span><br>every time<br><a href="#p71924607" class="quotelink">&gt;&gt;71924607</a><br>okay here
  
  
  <a href="#p71926084" class="quotelink">&gt;&gt;71926084</a><br>thanks fer yer service lad, every little bit counts against the krauts
  
  
  <a href="#p71924141" class="quotelink">&gt;&gt;71924141</a><br>Unless you have the rare woman who happens to be a chubby chaser or have a fetish for fat guys. They exist but again, they’re rare.<br><br>Most people who actually want to fuck fat men are gay men. It’s interested how men are willing to fuck fatties, regardless of sexual orientation.
  
  
  <a href="#p71925260" class="quotelink">&gt;&gt;71925260</a><br>What causes someone to have a fetish like this?
  
  
  <a href="#p71922278" class="quotelink">&gt;&gt;71922278</a><br>Not that I care or want some fat degenerate to continue existing but wouldn&#039;t you think the police, who are theoretically supposed to care would show up to a suicidal person call with some non-lethals? Just kind of funny they&#039;re at the place of some lunatic who wants to die and they give her exactly what she wants.
  
  
  <a href="#p71928723" class="quotelink">&gt;&gt;71928723</a><br><span class="quote">&gt;People</span><br>Magazine
  
  
  <a href="#p71928795" class="quotelink">&gt;&gt;71928795</a><br>Good practice for killing nigs
  
  
  <a href="#p71928168" class="quotelink">&gt;&gt;71928168</a><br>Thank you, been saying this the last two threads.
  
  
  <a href="#p71928200" class="quotelink">&gt;&gt;71928200</a><br>I kneel before your infallible logic.
  
  
  <a href="#p71925268" class="quotelink">&gt;&gt;71925268</a><br><span class="quote">&gt;those fleshpants</span>
  
  
  <a href="#p71925176" class="quotelink">&gt;&gt;71925176</a><br>he looks like the nigga cat guy kek
  
  
  remember anon, if you don&#039;t find this attractive you are a hecking bigot and you need to go on TRT
  
  
  <a href="#p71925596" class="quotelink">&gt;&gt;71925596</a><br><span class="quote">&gt;woman</span><br>Fatties don&#039;t even look human anymore lol<br>Might as well call someone lowtest for not fucking their dog, it looks just about as feminine
  
  
  <a href="#p71925746" class="quotelink">&gt;&gt;71925746</a><br>Newfags pulling this cope when they get told to put their money where their mouth is is a cliche at this point.
  
  
  <a href="#p71923772" class="quotelink">&gt;&gt;71923772</a><br>No wonder God has left us
  
  
  <a href="#p71929033" class="quotelink">&gt;&gt;71929033</a><br>Post body is a cliché too, especially when the one demanding it doesn’t post his own first. There could be other reasons. I don’t post mine because I won’t be part of any demotivating activity, plus I get bored with dyels constantly accusing me of frauding because they won’t put in the work it takes. Just as bad as fatties claiming genetics made them guzzle pizza.
  
  
  <a href="#p71923672" class="quotelink">&gt;&gt;71923672</a><br>lurk moar<br><a href="#p71924654" class="quotelink">&gt;&gt;71924654</a><br>I spit my fucking drink, fuck you
  
  
  <a href="#p71925614" class="quotelink">&gt;&gt;71925614</a><br>Binge healthy stuff. For me it&#039;s bananas, skyr and nuts. Satisfies sweet, creamy and savory (even chocolate-y if there&#039;s a lot of hazelnuts in the nut mix) cravings. If I want sour I go for kiwis or certain apples.
  
  
  <a href="#p71923638" class="quotelink">&gt;&gt;71923638</a><br><span class="quote">&gt;Can&#039;t Pause Eaton</span>
  
  
  <a href="#p71927491" class="quotelink">&gt;&gt;71927491</a><br>What I’ve been saying! Let’s humiliate “smallfats” so that I feel more shame and get more motivated to keep going!
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>Top 15 of things I wish I never read on the internet
  
  
  
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>dude
  
  
  <a href="#p71929274" class="quotelink">&gt;&gt;71929274</a><br><span class="quote">&gt;I don’t post mine because I won’t be part of any demotivating activity</span><br><br>based and supporting fellow men pilled
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a>
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>Boo, get better material.
  
  
  <a href="#p71929530" class="quotelink">&gt;&gt;71929530</a><br>Goddamn Chinese dream catchers.<br>Only buy from authentic Native American vendors.
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>Mom was right all along.
  
  
  <a href="#p71925558" class="quotelink">&gt;&gt;71925558</a><br><span class="quote">&gt;Age: 23</span>
  
  
  <a href="#p71922278" class="quotelink">&gt;&gt;71922278</a><br><span class="quote">&gt;&quot;RACHEL DROP THE KNIFE!!!&quot; </span><br>she took like a half dozen bullets i don&#039;t think she&#039;s in the position to drop the knife, let alone use it
  
  
  <a href="#p71924607" class="quotelink">&gt;&gt;71924607</a><br>I like assertive anon<br><br>More fat retards it is
  
  
  <a href="#p71925738" class="quotelink">&gt;&gt;71925738</a><br><span class="quote">&gt;right arm significantly beefier than the left</span><br>coom to failure daily
  
  
  <a href="#p71929657" class="quotelink">&gt;&gt;71929657</a><br>at least they stopped shooting and didn&#039;t continue after her last breath. &quot;DROP THE KNIFE!&quot;<br><span class="quote">&gt;chest moves a little</span><br>*BLAMBLAMBLAMBLAMBLAM*
  
  
  
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br><span class="quote">&gt;And it&#039;s so damn hard to lose at my age (40)</span><br>More bullshit excuses.<br>I&#039;m 53 and just lost 6.5% of my weight in less than a month (170 to 159).<br>Besides eating, fatties must sit around all day thinking of excuses.
  
  
  <a href="#p71928046" class="quotelink">&gt;&gt;71928046</a><br>Aahahaha you wouldn’t do shit, pussy
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>I am now forever cursed for having read this
  
  
  <a href="#p71925175" class="quotelink">&gt;&gt;71925175</a><br>Fuck man she could have been so beautiful if she were a normal weight. Her face looks like Galadriel, more like Gafridgeriel now.
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a>
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>I swear you’ll find a true crime video in your YT feed one day, descrbing how he commited the worst crimes of you can imagine.
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br><span class="quote">&gt;beer</span><br><span class="quote">&gt;wine</span><br><span class="quote">&gt;liquor</span><br><span class="quote">&gt;milk</span><br><span class="quote">&gt;water (sparkling or still)</span><br>These are the only appropriate things to ever drink
  
  
  <a href="#p71928627" class="quotelink">&gt;&gt;71928627</a><br>What athlete has 6% bf? This is nonsense.
  
  
  <a href="#p71928795" class="quotelink">&gt;&gt;71928795</a><br>remember cops have no responsibility to &quot;save lives&quot; they are there to enforce laws. They literally just come to make sure you don&#039;t harm anyone else if you just happen to kill yourself or get killed in the process, it&#039;s not their problem
  
  
  <a href="#p71924216" class="quotelink">&gt;&gt;71924216</a><br>a toast to haes
  
  
  <a href="#p71929844" class="quotelink">&gt;&gt;71929844</a><br>There&#039;s a video if a cop chasing a guy onto a busy road and the guy gets nailed by a truck. Dude is laying there twisted in three direction and obviously dead and they still cuff him.<br>Wouldn&#039;t doubt anything.
  
  
  <a href="#p71931419" class="quotelink">&gt;&gt;71931419</a><br>Yeah uh that didn’t happen
  
  
  <a href="#p71931440" class="quotelink">&gt;&gt;71931440</a><br>https://www.youtube.com/watch?v=S64<wbr>XG0jvBC0
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a>
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br>im in a 13 year relationship with my fit wife and i miss fucking fat women<br><br>desperately. i loved fucking fat women.
  
  
  <a href="#p71923772" class="quotelink">&gt;&gt;71923772</a><br>Buffalo bill vibes
  
  
  <a href="#p71929950" class="quotelink">&gt;&gt;71929950</a><br>Mirin bulk
  
  
  <a href="#p71925226" class="quotelink">&gt;&gt;71925226</a><br>beached whale
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br>bait and fake<br>anyways<br>my male friend is 5&#039;6 235 lbs and he&#039;s fat as shit<br>you&#039;re grossly obese
  
  
  
  
  
  <a href="#p71925738" class="quotelink">&gt;&gt;71925738</a><br>Lats 6 days a week and swimming everyday
  
  
  Guys. I discovered that I’ve ironically lost more weight being unemployed than while being employed. I was never fat to begin with, but now I’m very lean, while the scale wasn’t budging during employment. Why is this?
  
  
  <a href="#p71931702" class="quotelink">&gt;&gt;71931702</a><br>different schedule, probably. unless you move more than you did while working.
  
  
  <a href="#p71931732" class="quotelink">&gt;&gt;71931732</a><br>I don’t by a longshot. I theorize that my relative inactivity is actually causing me to eat less overall. You would think me being sedentary would cause me to get fat
  
  
  <a href="#p71931744" class="quotelink">&gt;&gt;71931744</a><br>Diet for weight loss, exercise for muscle and stamina. Ideally do both.<br><br>T. Ex fatty who started looking like a molten candle as he lost weight, so he started strength training as well.
  
  
  <a href="#p71927840" class="quotelink">&gt;&gt;71927840</a><br>You don&#039;t say...
  
  
  <a href="#p71923646" class="quotelink">&gt;&gt;71923646</a><br>You can tell there&#039;s a babe under all that
  
  
  <a href="#p71931440" class="quotelink">&gt;&gt;71931440</a><br>Go back to r*ddit, faggot.
  
  
  This is such a reddit post holy moly
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>Reading this post has made me profoundly sad. I don’t even want to mock this woman. Thank god I’m in shape.
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>how do people like this exist, what circumstances must arise for a man to go down this path in life?
  
  
  <a href="#p71928044" class="quotelink">&gt;&gt;71928044</a><br><a href="#p71927994" class="quotelink">&gt;&gt;71927994</a><br><span class="quote">&gt;&gt; baguettes</span><br><span class="quote">&gt;&gt; croissants</span><br>I hate americans so much. <br>French (or at least parisian) women are skinny as fuck since we bully them into not being overweight, and these american fatsos are like &quot;tee-hee lemme just munch on these delicious pastries hihihi&quot;<br><br>FUCK OFF. <br>You&#039;re rich, isn&#039;t that enough for you retards? STOP EATING. STOP EATING. STOP EATING. <br>For fuck&#039;s sake, we should have let the br*tish enslave you.
  
  
  <a href="#p71928828" class="quotelink">&gt;&gt;71928828</a><br>Underrated
  
  
  <a href="#p71923651" class="quotelink">&gt;&gt;71923651</a><br>yes
  
  
  <a href="#p71925226" class="quotelink">&gt;&gt;71925226</a><br>Eggman really let himself go...
  
  
  <a href="#p71925175" class="quotelink">&gt;&gt;71925175</a><br>Her Tinder/Bumble/Hinge profile pic
  
  
  <a href="#p71931996" class="quotelink">&gt;&gt;71931996</a><br>yeah, babe the sheep-pig
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br><span class="quote">&gt;old and fat</span><br>when you&#039;re born into easy mode but decide you&#039;d rather play on nightmare
  
  
  <a href="#p71923997" class="quotelink">&gt;&gt;71923997</a><br>It’s not a big ass she’s just fat and gross. Like you probably are too
  
  
  <a href="#p71924574" class="quotelink">&gt;&gt;71924574</a><br>This
  
  
  Fatphobia in viral country song &quot;Rich Men North of Richmond&quot;<br><br>I don&#039;t know if you guys have seen/heard it yet but over the weekend a country/bluegrass song blew up, in a similar manner to &#039;Try that in a small town&#039; a few weeks ago.<br>Conservative media are calling it &quot;the voice of a generation&quot; &quot;what everybody&#039;s thinking but too scared to say&quot; and even some so-called leftists are claiming the song is class conscious. To me, it just looks like a blatant astroturf campaign.<br>Here&#039;s the segment of lyrics that made me despair:<br><br><span class="quote">&gt; I wish politicians would look out for miners,</span><br><span class="quote">&gt; And not just minors on an island somewhere</span><br><span class="quote">&gt; Lord, we got folks in the street, ain&#039;t got nothin&#039; to eat</span><br><span class="quote">&gt; And the obese milkin&#039; welfare</span><br><span class="quote">&gt; Well, God, if you&#039;re 5-foot-3 and you&#039;re 300 pounds</span><br><span class="quote">&gt; Taxes ought not to pay for your bags of fudge rounds</span><br><br><br>Yeah, so class conscious, punching down on fat women and welfare recipients... while claiming to care about homelessness!?<br>I&#039;m bigger than the weight reeled off. I&#039;m just angry and tired of being dehumanized, having people celebrate these tropes; we&#039;re lazy, drains on society, binging fudge rounds on the taxpayers dime, etc.<br>Not to mention the dismissiveness towards child sexual abuse?? Seeing online commentators who really should know better promoting this song, it just sucks. I&#039;m so very tired y&#039;all. Do you guys have anything you&#039;d like to add?
  
  
  <a href="#p71925596" class="quotelink">&gt;&gt;71925596</a><br>He was spot on. Quit simping for fatties you weak pathetic excuses for a man
  
  
  <a href="#p71923819" class="quotelink">&gt;&gt;71923819</a><br>I think this is cute. Disgusting, but cute.
  
  
  <a href="#p71925738" class="quotelink">&gt;&gt;71925738</a><br>Belly laughs at fatties until failure
  
  
  <a href="#p71925746" class="quotelink">&gt;&gt;71925746</a><br>Ah the cope of the called out and exposed. Every fucking time
  
  
  It&#039;s always funny seeing gymcels react to fat losers who are more sexually successful than them. They get so prissy and melodramatic. Very womanly. This retarded, manchild faggot has never lifted a day in his life, and he&#039;s still doing better than 99% of /fit/.
  
  
  <a href="#p71933148" class="quotelink">&gt;&gt;71933148</a><br><span class="quote">&gt;fat larp</span><br>many such cases
  
  
  <a href="#p71929530" class="quotelink">&gt;&gt;71929530</a><br>Kept waiting for it to come out of the ceiling
  
  
  <a href="#p71930654" class="quotelink">&gt;&gt;71930654</a><br>Honestly I doubt it. He’s too fat and too much of a mental and physical weakling to do anything in real life. I know he’s a mental weakling because strong minds don’t have (or express) those thoughts, and he’s fat. Fatties have weak minds.
  
  
  <a href="#p71923651" class="quotelink">&gt;&gt;71923651</a><br>I&#039;m fatphobic, racist, intolerant of the slightest deviance from heterosexuality, and dislike anyone in my immediate vicinity in the gym who isn&#039;t lifting at least as much as me.
  
  
  <a href="#p71933148" class="quotelink">&gt;&gt;71933148</a><br>Are you Jewish?
  
  
  <a href="#p71927719" class="quotelink">&gt;&gt;71927719</a><br>a mental fix, you autist
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>i want to get off mr bones wild ride :(
  
  
  <a href="#p71924437" class="quotelink">&gt;&gt;71924437</a><br>If you don&#039;t live around many other people and you live in a very pretty natural area you sort of get in the kosher of thinking ALL human habitation is ugly. I mean of course when I go into town to the store or something I feel like I&#039;m walking through some kind of fucking fatass Rob Zombie movie sometimes but then again I&#039;d be down on society even if they weren&#039;t fat. In practice all it means is that you have to spend a little more money when you go to town to avoid the dregs. <br><br>Now the bigger problem is the welfare state. These people&#039;s health issues have a direct impact on me. Now this is even more true of Canada and yuros etc. but even in the US it is true too. The moment one single red cent of my tax money went to these people&#039;s bullshit is the the moment I had a direct say so in the situation. All these people saying &quot;mind your own business&quot; etc. are still living in the pre welfare-state mindset. They want the gibs but still want the privacy and freedom and you never get both.
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>jesus christ shaking the drink was the most exercise this bitch has ever done in her lifetime
  
  
  <a href="#p71922600" class="quotelink">&gt;&gt;71922600</a><br>That looks good
  
  
  <a href="#p71923772" class="quotelink">&gt;&gt;71923772</a><br>how come some fat people just get round and others go full sharpei?
  
  
  <a href="#p71927491" class="quotelink">&gt;&gt;71927491</a><br>those are innocent fats. They were probably regular people in high school who are now too busy with their sedentary office job to work out. They&#039;re probably unaware of the rapidly declining quality of food and the increase in fillers in everything.They probably eat regular portions of food, but the food they eat has been pumped full of corn syrup and sneed oils. If they lived 50 years ago they would be regular weight, but the globohomo we live in made them 25%<br><br>its the morbidly obese that deserve ridicule. <br>The ones who take up 2 seats on the bus.<br>The ones who eat more than their share at the family BBQ<br>The ones making tiktoks about body positivity<br>The ones demanding every public building have a ramp for their mobility scooter<br>The ones too fat to wipe their own ass so they stink up the line at Walmart<br>The ones forcing themselves onto billboards as plus sized models.
  
  
  <a href="#p71926851" class="quotelink">&gt;&gt;71926851</a><br>keep your addictphobia to yourself, we as a species have survived for millions of years on well evolved instincts, so i choose to listen to my body when it tells me what it needs, and what it needs apparently is lots and lots of heroin all the time
  
  
  <a href="#p71933861" class="quotelink">&gt;&gt;71933861</a><br><span class="quote">&gt;too busy with their sedentary office job to work out</span><br><br>no such thing. even a half-hour walk each day would be much better than doing no exercise at all, which is what they do. everyone has at least a half-hour in their day to take care of themselves
  
  
  <a href="#p71927994" class="quotelink">&gt;&gt;71927994</a><br><span class="quote">&gt;roasting the woman who birthed you for internet points</span><br>i hope she molested you or something to earn such disrespect
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>literally the meme
  
  
  <a href="#p71933929" class="quotelink">&gt;&gt;71933929</a><br>legbeard spotted
  
  
  <a href="#p71927491" class="quotelink">&gt;&gt;71927491</a><br>You&#039;re absolutely right. I still won&#039;t fuck &quot;normal&quot; fatties or ever listen to their opinions on my weight again, but I&#039;m way too resigned about them. Deathfats everywhere makes the &quot;merely&quot; overweight all too easy to accept.<br><br>I guess the other issue is that mocking the pudgy isn&#039;t as funny as going after the utterly delusional hamplanets, and the (ironic or not? Doesn&#039;t matter, the effect is the same) fetishists aren&#039;t gonna go for just a bit of lard, either
  
  
  <a href="#p71925365" class="quotelink">&gt;&gt;71925365</a><br><span class="quote">&gt;tfw no qt 8ft yamato gf</span>
  
  
  <a href="#p71929950" class="quotelink">&gt;&gt;71929950</a><br>Who mogs who?
  
  
  <a href="#p71933861" class="quotelink">&gt;&gt;71933861</a><br><span class="quote">&gt;paying attention to things that aren&#039;t my job or jew media is too much effort</span><br>ignoring ingredient labels is inexcusable.
  
  
  <a href="#p71932289" class="quotelink">&gt;&gt;71932289</a>
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>What the fuck
  
  
  fresh <a href="/fit/thread/71934358#p71934358" class="quotelink">&gt;&gt;71934358</a>
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br><span class="quote">&gt;250 pounds and I’m 5 ft 1</span><br><span class="quote">&gt;Tfw two months of no sex</span>
  
  
  <a href="#p71927665" class="quotelink">&gt;&gt;71927665</a><br>being fat to the point of being physically disabled requires some high tier mental dysfunction, it&#039;ll rarely be compatible with any sort of functionality in any aspect of life.<br>still, there are exceptions, and of course very fat celebrities and wealthy people exist all over the place.<br><br><span class="quote">&gt;Don&#039;t tell me my tax dollars are paying to keep these brokies on life support.</span><br>it&#039;s mostly just them leeching off enablers/feeders
  
  
  <a href="#p71930876" class="quotelink">&gt;&gt;71930876</a><br>Essential fat means minimum bodyfat needed to regulate hormones and natural processes, retard.
  
  
  <a href="#p71931620" class="quotelink">&gt;&gt;71931620</a><br>i love such a short sentence being pointed out as &quot;breathless&quot; like it&#039;s some feat<br>https://www.youtube.com/watch?v=Ju_<wbr>oS3_MHac
  
  
  <a href="#p71923819" class="quotelink">&gt;&gt;71923819</a><br>Needs an architect edit
  
  
  <a href="#p71922128" class="quotelink">&gt;&gt;71922128</a><br>You&#039;re better off just calculating your BMR and eating like 200 calories less than that with monthly fasting until you resemble a human, gym optional.
  
  
  <a href="#p71924607" class="quotelink">&gt;&gt;71924607</a><br><span class="quote">&gt;mfw people are still posting complete bullshit like this</span><br>I guarantee this was written by a nurse, not an actual doctor, as only nurses can so self-righteously lecture you while being completely wrong.
  
  
  <a href="#p71926235" class="quotelink">&gt;&gt;71926235</a><br><span class="quote">&gt;he&#039;ll be stopping by soon enough</span><br><span class="quote">&gt;t. every christian for the past 2000 years</span>
  
  
  <a href="#p71934240" class="quotelink">&gt;&gt;71934240</a><br>I&#039;ll wager the nafris and blacks contribute heavily (kek) to that statistic
  
  
  <a href="#p71930182" class="quotelink">&gt;&gt;71930182</a><br><span class="quote">&gt;not Galardriel</span>
  
  
  <a href="#p71922092" class="quotelink">&gt;&gt;71922092</a><br>if you pricks can&#039;t help OP then at least help the woman who correctly ID&#039;ed the problem as her porn-sick husband.<br><br>give her some advice on her stinky mom. It&#039;s an old thread but you can DM her at u/fire_thorn
  
  
  <a href="#p71923613" class="quotelink">&gt;&gt;71923613</a><br>pic is unrelated btw, not for the horror read`;

  str = removeQuoteLinks(str);

  str = str.decodeHtml().stripHtmlTags();

  const posts = str
    .split("\n\n\n")
    .filter((s) => s)
    .map((s) => s.trim())
    .sortBy((s) => -s.length);

  str = `${prompt}\n\n\n${posts.join("\n\n\n")}`.shorten(5000);

  const result = await chat.send(str);

  // const result = await chat.send(
  //   `Give me 0-1 scores for this text on the following dimensions:
  //   shitpost (unintelligable text, nonsense)
  //   offensive (racist, sexist, homophobic, etc)
  //   spam (advertising)
  //   quality (well written, interesting)
  //   language (two letter language code)

  //   Reply in JSON format:
  //   { shitpost: 0.5, spam: 0.5, quality: 0.5, language: "en" }

  //   The text is:

  //   According to “Breaking Bad” and the Jesse Pinkmans of the world, we do, A LOT!
  //   `
  // );

  process.exit();

  // const url1 = "http://localhost:4041/MemeGenerator/api/Builders/select/all";

  // const res = await axios.request({
  //   url: url1,
  //   timeout: 5000,
  // });

  // console.log(res.data);

  // process.exit();

  const url = "http://localhost:4041/MemeGenerator/api/Instances/create/one";
  const body = {
    languageCode: null,
    generatorID: 1104,
    imageID: null,
    text0: null,
    text1: "test",
  };

  console.log(url);

  const options = {
    url,
    method: "POST",
    data: body,
    responseType: "stream",
    // We want to proxy the request as-is,
    // let the client handle the redirects
    maxRedirects: 0,
    timeout: 5000,
    mode: "no-cors",
  } as any;

  try {
    const response = await axios.request(options);

    const responseData = await Http.getResponseStream(response);

    console.log(responseData);
  } catch (ex: any) {
    console.log(ex.message.bgRed.white);
  }

  process.exit();

  // const url = `http://localhost:4042/MemeGenerator/api/Medias/create/one`;

  // const body = { media: { test: 1 } };

  // const options = {
  //   url: url,
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   // We want to proxy the data as-is,
  //   responseType: "stream",
  //   // We want to proxy the request as-is,
  //   // let the client handle the redirects
  //   maxRedirects: 0,
  //   timeout: 5000,
  //   mode: "no-cors",
  // } as any;

  // try {
  //   console.log(url.green);

  //   const response = await axios.post(url, body, options);

  //   console.log(response.data);
  // } catch (ex: any) {
  //   console.log(ex.message.bgRed.white);

  //   if (ex.response) {
  //     const data = await Http.getResponseStream(ex.response);
  //     console.log(data);
  //   }
  // }

  // process.exit();

  //const config = (await Configuration.new()).data;

  // const root = await LiveTree.Api.getFolder("c:/eff/Development");

  // const path = ["Shared", "Timer.ts", "Timer"];

  // let node = root as LiveTree.Node | undefined;
  // while (path.length) {
  //   await node?.populate();
  //   node = await node?.find(path.shift() || "");
  // }
  // await node?.populate();

  // console.log(
  //   util.inspect(
  //     await root.select((n) => {
  //       return { title: n.title, info: n.info };
  //     }),
  //     { depth: 10, colors: true }
  //   )
  // );
})();
