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
import { ChatOpenAI, Role, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Model } from "../Apis/OpenAI/classes/OpenAI";
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";
import { LiveTree } from "@shared/LiveTree";
import { Diff } from "@shared/Diff";
const esprima = require("esprima");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer: string) => {
      resolve(answer);
    });
  });
}

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
  // const str1 = `summarize this, in the style of "4han users in this thread are discussing..`;

  // const threads = [
  //   "THIS LINK COVERS THE FOLLOWING TOPICS:\n- Proven, effective exercise routines\n- Diet\n- How to lose weight\n- How to gain weight\n- Supplements\nCLICK AND READ THIS BEFORE STARTING A THREAD ABOUT THESE TOPICS\n \nSupplemental reading:  Harsh's /fit/ Wiki",
  //   "What are some good supplements/vitamins to take? I already take magnesium, zink, vit d and c and multivitamin for males",
  //   "Recently I woke up one day and decided that I want a septum ring.I've always found them pretty neat.A septum also doesn't leave any visible scars which is a great argument for just going for it.Most people I know thypically dislike them and obviously do the classic where they reference a cow.I'll probably give it 2 weeks of consideration before I go for it just to check if I'm getting tricked by brain chemicals.I'm your thypical masculine male that is into metal btw.Opinion?",
  //   "what is the best way to build a strong core if one doesnt have gym equipment?Considering joining a gym asap but atm it's not an option to deadliftpic unrelated",
  //   "Post your coffee.",
  //   "Is this board's anti-roids stance just crab bucketing?",
  //   "Do I have to get to sub 10% for this to go away?",
  //   "Human v Chimp. Who'd win?",
  //   '>decide to try out coffee for the first time ever (27 years old, never drank it)>my mom brought some imported product from the netherlands "3 in 1 instant coffee" powder packs>first thing i notice is the absolutely insane calory count>check a bit more it\'s 63% sugar, jesus christ>drink it>for some reason my balls get really tight, my temples tense up, feels like my head is in a vice, and my chest feels funnywhat the fuck is this shit',
  //   "Give me 1000 dollars",
  //   ">hogs the whole communal kitchen counter with his shitty arab supplements>puts bag on counter (unhygienic) >flatmates starving have to wait outside because recording for his youtube channelWhat an inconsiderate piece of shit",
  //   "Which way Western man?",
  //   "My hip clicks and it also started hurting recently, what do",
  //   "How is it the rates of auto immune diseases is increasing?Why is it when I make a simple change to my diet by excluding dairy my autoimmune arthritis goes completely away?Why is it the doctors never suggested such a simple fix? Not once did they say I should try changing what I eat.",
  //   "sex is the best cardio",
  //   '>6ft1 185lbsLet me guess you "need" more',
  //   "Has the gym made women too cocky?",
  //   "What is the best machine for cardio?",
  //   "Forbidden burger edition>Who is /fat/ for?For Lardy Laardvarks who are working towards a better physique through meaningful hard-work, strategy, and dedication. This is not QTDDTOT, stick to questions on fat loss. Post height and weight when asking for advice.Join our Fatty Contest: https://www.fattycontest.com/>What do I do first?1. Read https://physiqonomics.com/fat-loss/2. Calculate your Body Fat Percentage: https://fitness.bizcalcs.com/Calculator.asp?Calc=Body-Fat-Navy3. Calculate your TDEE: https://www.sailrabbit.com/bmr/Remember to use bodyfat% and use Katch-McArdle Formula with sedentary settings or your TDEE will be too high.4. Plan your weight loss: https://www.losertown.org/eats/cal.php5. Track your nutrition with MyFitnessPal (better for packaged food), Cronometer (better for generic food/macros) or LoseIt (great for both).>Now what?Count calories, all of them.Eat about 500-1000 less calories than your TDEE.Buy scales, be accurate.Learn to cook. Try to stick to lean protein and green vegetables.Eat a lot of protein. 0.72g per lb of goal lean body mass.Doing cardio, even just walking, will improve your health. There is no such thing as a healthy fat heart, but you can offset the risks.Lifting weights will keep and gain muscle mass and burn fat much quicker. No lifting results in the body burning away muscle AND fat.Drink more water.Read the /fit/ sticky: https://liamrosen.com/fitness.html>DON'TEat refined sugars, they're terrible for you regardless of calories.Eat processed foods.Drink your calories (alcohol, soda, starbucks).Freak out over a weight loss stall. Plateaus can last up to three weeks.\"Reward\" yourself. Cheat days cheat only yourself.>Other resources:Loose skin, gyno & stretch marks: https://weight-loss-side-effects.netlify.app/Reddit wiki: https://www.reddit.com/r/loseit/wiki/faqPrevious thread: >>72227867",
  //   "Redpill me on the gut microbiome, how do I optimize it?",
  //   "LETS GO TO THE GYM BUDDY",
  //   "This is a 19 year old pro physique athlete. If you think sam sulek is on some crazy cycle you know nothing about bodybuilding. There are levels to this game that you cant even begin to imagine Gh15 approved",
  //   "How does /fit/ cope with this?",
  //   "What are the best martial arts to learn for self-defense?",
  //   ">Eat meat>Wakw up woth heaviest boner i had in a year>Penis is longer tha before",
  //   "i have 10\" anklesgoogle tells me this is 99th percentilethere's no way this is right... right? they don't look remarkable at all and no i'm not fatdoes this actually translate into greater potential? in football they want athletes with skinny ankles where strength is still valued greatly",
  //   "She's way less sexual than before. Rejects my advances. Looks annoyed when I initiate sex or tries to change the subject. Occasionally she would say I look really sexy when I come out of the shower but we don't have sex everyday like when I used to be a DYEL. Help me decipher this bitch",
  //   "Why is nutritional health such a hard thing for the scientific crowd to agree upon?",
  //   "How to reach this level of core /fit/ness? Is it possible natty?",
  //   "Back Day Edition",
  //   "How the fuck do you deal with flocks of random fucks around you at the gym? If I don’t have a friend around it drives up a wall. Too many people, in my way, I’m self-conscious about being in someone else’s way, etc.",
  //   "do u smke wed",
  //   "Should I model? I'm not international but could do local stuff and maybe the occasional second tier national. Seems like easy beer money but it'd be a ballache to get fit enough and I don't want to get casting couched by some old homo",
  //   "Are asian women evolving? I've never seen fit asian women until recently",
  //   "Is divorce reasonable if my niece and I are not sexually compatible?",
  //   ">on 4th date with this girl>we go to the beach>see thisIs this enough cause to end it? I feel betrayedAngle frauding, cellulite, stretch marks... It's not about the physical flaws, it's about the fact that (((they))) tried to hide them from (((us)))I bet she has a tattoo near her butthole too",
  //   ">chuds were rightAPOLOGIZE",
  //   "Kiwi/Aus bros, anyway to get cheap beef Jerky? jerk pill me.",
  //   "Why there are material realm entities posting/enjoying gore content? And what do they feel about itAlso not fit related but am asking /fit/ since its the sanest of them all",
  //   "I lift for BBC! (Brown Brat Correction)",
  //   "I've been lifting for a few years now but I've essentially started looking like a tiktok influencer by this year, not more than a year ago I couldn't really talk to girls and would easily get attached to any girl that's interested and bond, now that dating and life in general has become considerably better and easier, I can't feel attachment anymore, I know I don't need any girl or even any of my friends really, my life is good on it's own and it'll be good with or without anyone particular, and since it's easy to replace quite literally anyone, I feel zero connection with most people",
  //   "I need a basic outline of a calisthenics routine for a small male frame 125 I don't want to do major diet changes or something that can end up unhealthy from to much strain I just want a little more muscle and weight my goal is to reach 145 I'm 5,6 or 5,7 idk I say 5,7 because we all know anyone under 6 foot will take every inch they can get lol but pic of my frame light flex but really drunk so probably not the best pic",
  //   ">Does one dipHeh...nothing personnel...kid!",
  //   "CTRL-F, no QTDDTOT. I'll start: how often can I train my hip flexors? I do Upper/Lower/Rest/Upper/Lower/Rest... one day will always be either just after training them or just afterWhy can I squat about 1.5x heavier if I don't break parallel, what is it about that part of the movement that is so difficult and how do I train it? My squat in general is terrible, I squat less than my bench but I train it as frequently - what's the deal?",
  //   "/fit/ is now the worst place on the entire internet to discuss fitness. Is it even possible to improve it anymore?",
  //   "I am 6'2\" with a 6'3\" wingspan and similarly overlong legs. How much slower can I expect my bench and squat progression to be than the average lifter (meme numbers being 1/2/3/4 within a year of proper training with sufficient recovery and surplus)I would appreciate real advice from similarly tall experienced lifters and will submit weather reports if requested.",
  //   "post progress of fellow /fit/ girls",
  //   "Natty only",
  //   ">you cant even hide from them in the treesThere is nothing you can do to stop a tiger. The definition of an alpha.",
  //   ">teehee you're a nice guy Chad, but i'm dating Eugene right now. Try again when i'm 30 and had my fun :)",
  //   "Please tell me you're not doing yoga, they can kill you",
  //   "Post brutal mogs",
  //   "What is the cause of this and how to fix it?>inb4 lose weightI'm literally 130 lbs.",
  //   "How do I get bigger butt?",
  //   ">Advice for new runners- Build up speed and mileage SLOOOWLY (start with 15 minutes, increase mileage 10% per week)- It will feel like you're going slow, you are; don't worry about setting good times for a couple months- If you start to feel pain anywhere, stop and rest- Don't try to copy what pros are doing. Do what feels natural- Once you can comfortably run 6 miles/10km, start thinking about a goal in terms of race distance and time, and look for a training plan for that goal (see below for suggested plans)>Couch to 5k/Bridge to 10k Guideshttps://www.nhs.uk/live-well/exercise/running-and-aerobic-exercises/get-running-with-couch-to-5k/https://i.imgur.com/ef98R.pnghttps://i.imgur.com/qNJIy.png>Sprinters Guideshttps://trackstarusa.com/free-track-workouts/>I want to run a fast 5k, 10k, half-marathon, or marathonhttps://www.runningfastr.com/https://www.halhigdon.com/>Stretchinghttps://www.runnersworld.com/uk/training/beginners/a32172701/how-to-stretch-post-run/>Performance calculatorshttps://runbundle.com/tools/age-grading-calculatorhttps://runninglevel.com/>Previous thread>>72228617",
  //   "Am I going to make it?",
  //   "For reference, I'm 29yo Male. I lift, long distance run, train MMA and eat well most of the time. I also have generally avoided porn porn for the past few years and I No Fap.I feel like my sex drive is the highest it's ever been in my life. I want to destroy my gf about four times a day and sex is all I really think about when I'm not focusing on training or something else physically demanding.Is my sex drive unusually high? What is it like for everyone else on /fit/?",
  //   "Boxing is better for fizeek than MMA, plus its way less gay. >Wladimir Klitschko >Canelo>Dolph LundgrenMMA is gay, discuss",
  //   "JUST FOUND OUT THE GIRL I HAVE BEEN CRUSHING ON FOR 10 MONTHS IS ENGAGED JUST AS I WAS ABOUT TO ASK HER OUT AAAAAAAAAAAAAAAAAHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
  //   "Programming Advice?Post S/B/D@BW/Height+Age>The Official Pastebinhttps://pastebin.com/V84Y0J9Y>Conjugate pastebinhttps://pastebin.com/hwp2ANaT>Tripfag Numbershttps://pastebin.com/xqFCG4t9Previous Thread: >>72234836",
  //   ">Claims to eat no carb or low carb>Eats meat",
  //   "I want to lose weight but I get hungry frequently even when I eat large protein-rich meals. Going to the gym makes it worse. I've unironically taken to drinking a lot of coffee and smoking cigarettes. Im 6 ft 250 lbs",
  //   "Is is possible to grow after age 26 as a 185cm manlet?Also respond on nu fitPlebchan.eth.limo/health-nutrition-science.ethGitHub.com/plebbit",
  //   "why do i look fat no matter how much weight i lose",
  //   "is this achievable natty",
  //   "How important is the pump when training for muscle gain? And soreness?",
  //   "What is the unique mechanism of retardation that leads retards to think all science is wrong?",
  //   "Do the right shoes make any difference at all when running, or is that a bunch of malarkey?",
  //   ">gives you 40 minute heart to heart about topics ranging from investing, to relationship, to deciding to stay natty or notI miss him so much bros",
  //   "23% of Gen Z has at least one tattoohttps://www.statista.com/statistics/1261721/americans-with-at-least-one-tattoo-by-number-and-generation/",
  //   "Chronic Constipation? how do i fix, had it for 15years, currently 31yo no one else in my family has it, my doctors have said nothing is wrong with me, i've tried all the poopmaxxing diets and still the same. It's very embarrassing , trying not to use laxatives, Please save me bros! God Bless",
  //   "Mao banned body building in China. It would take 3 decades for the ban to be abolished. It looks like Canada is going to be next in line to ban it. Trudeau Liberals and feminists are teaming up to heavily regulate and tax whey protein, creatine, vitamins, fish oil and other \"gateway supplements\" that might lead to gains. It's for your own good after all.>Muscle-building supplements are hugely popular with Canadian boys and young men: That’s a problemhttps://healthydebate.ca/2023/09/topic/muscle-building-supplements/https://www.msn.com/en-ca/health/other/opposition-parties-warn-new-natural-health-product-regulations-could-drive-up-costs/ar-AA1g3QZ1https://medicalxpress.com/news/2023-09-commonly-muscle-building-dietary-supplements-canada.htmlhttps://ca.news.yahoo.com/natural-health-product-regulations-them-014103808.htmlI thought that if I couldn't afford to buy my own home, at least I could turn my body into a temple. I could at least be content with that. Now this.",
  //   ">What is /fast/?/fast/ is a thread for the discussion of all forms of fasting (intermittent fasting, water fasting, fat fasting, etc.)>Electrolytes (recommended for longer fasts):sodium ~500-1,000 mg/daypotassium ~2,500 mg/daymagnesium ~400 mg/dayphosphorus ~500mg/dayPost 'em:>SW (starting weight)>CW (current weight)>GW (goal weight)>Height>Fasting scheduleThere is no such thing as a repetitive question!Previous thread >>72219949",
  //   'It just seems wrong, I mean, I\'m used to the skinny, delicate faggots that you can just punch in the face, break their nose and they\'d just run away crying to their other faggot friends. Seeing a bearded big dude talking and acting like a faggot just seems... off, in a bigger way than just seeing a """normal""" faggot.Anyways, if faggots tend to die young, why do they care about health and fitness at all? They\'d get fucked in their rectums either way, as fags have no standards.',
  //   "Why is there a duck in my gym?",
  //   "How did his head grow three sizes?",
  //   "You rdl? More like you r-dyel",
  //   "Is this the ultimate bulk food?",
  //   "Post your rants fitness relatedFor example>what is it about leg presses that make people think they don’t have to rerack their weights",
  //   "I have this theoryYour athleticism goes up simply by losing weight and and losing bodyfat %. You don't even have to train.Think about it. Your cardio goes up. Your strength to weight ratio goes up. You don't even have to work hard, just eat less while maintaining protein intake.",
  //   "Anybody get noticed lately?",
  //   "https://knowyourmeme.com/memes/addictedtoana-ihop-dance-were-all-the-person-at-the-next-tableMaybe not obese, but surely fat, right?I came across pic related (different view of her) on the KarenFarms. Some lolcow called her fat, and bizarrely, the KFers all agreed she WASN'T fat, despite obviously having a bf% north of 25%, maybe even 30%.Frankly, she looks like she could be borderline obese, or close to it, and these people are convinced she's not even fat?Have I gone crazy?",
  //   "Boomer thread. So how is your fit and general life anon? Do you have any tips for 40+ lifting/calisthenic? For me (41) its allright but it feels like after i train fullbody i always feel so tired and dont feel like doing anything else on my training day. And my recovery is shit too always feel my body is sore the next day.",
  //   "Anyone have a cutting stack they use? I know the obvious, lift heavy, hit protein, hit under your calories -- but is there anything you guys do that gives you some type of edge?I have a friend who swears by IF fasting, another that drinks like 3 Yerba Mate drinks a day, Says there's some chemical that increases fat burning. Is that true or is it bs?",
  //   "Why aren't you doing gymnastics?",
  //   ">Eat free proteins from your local park when squirrels and other creatures are outside, and save for paying down your debt! It's that simple!!!!",
  //   "So I've been on a few dates with this girl, and I really like her actually. She's the first girl I've ever really been dating or whatever, and I'm the first guy she's ever really dated. I just recently learned that she has Alport Syndrome. I had no idea this even existed until today, but she told me about how she actually had to get a kidney transplant a few years ago and was on dialysis for some time. Here's the thing, this doesn't change how I view her personally, if anything it actually improves my opinion of her as that is some hard shit to go through, but I do really want to have children in the future and was wondering if this would affect them. I obviously want the kids I have to be healthy, and I also wonder if this would affect her fertility in any major way. I don't really want to have this conversation with her since it feels a little rude desu so I hoped one of you anons may have some answers to my questions here. Thanks.",
  //   "All women should aspire to this exact body. High T men will understand",
  //   ">Be me>Want to start getting stronger and more confident >Discover /fit/>Specifically the greentext about the guy who goes out at night and fights random people >Decide to try it myself last nightMfw my last memory is getting smacked in the nose and I just woke up after having surgery to rebuild my nose",
  //   "5'11 200lb 21% fatty niggas should i hop on SARMs so i maintain my little gains while cutting? be honest with me i ain't even reached 225 on bench or 315 on squat idgaf about strenght i just wanna look good and fuck egirls",
  //   "Yo voy al gimnasio.",
  //   "Is it over?",
  //   "Today I OHP 115 for 10 reps. Monday I OHP 135 for 5. Which is more impressive? Also OHP thread include tips to increase the absolute hardest lift. No standing bench pressers allowed.",
  //   ">farted next to the gym crush in the gym while squating>can't go back there anymoreHow you deal with situations like this in the gym?",
  //   "hi /fit/, rate my home gym/10 and post yours.i need more dumbells and plates but cant afford them right now.got sick of the commercial gym because too many people and too much wasted time.",
  //   ">concentration curls",
  //   "It was OHP day (anime girl clenching fists.jpeg).It was ok, also did deficit push ups, can do 3 sets of 20.I don't know how many normal push ups I can do in a row right now, last time I did 62 but at the end of my workout. At full power I don't know.I listened to some future house during my lifts.2015 was very chill, Future House was killing Big Room.Tchami is the best, I don't know why Oliver Heldens was more popular, he's good but not like Tchami.How was your day?",
  //   "Hungry? No problem. Just say this one line:\"I'm full.\" That's it! Hunger gone. Don't forget your line and you'll be thin in no time!",
  //   "The only reason I haven't tried it is because beating off a few times a day reminds me my penis is working.",
  //   "Where my jeans-jogging anons at?",
  //   "I just hate people that wear blue shirts in the gym.It's so distracting.",
  //   "Prove me wrong",
  //   "...",
  //   "Is this the best carb?",
  //   "My roommate is thinking of starting to lift some weights. I'm eager to teach him everything, but if his challenging set would be just the empty bar. Would switching multiple plates every set turn him off and make him quit? This would only be a problem on bench since there are multiple squat racks.",
  //   "I found my weak muscles. I can confirm that I can't do a 5kg chest press, using those string things. I could \"do them\" when I did them wrong and didn't have correct horizontal arm positions. I finally did them in front of a mirror and oh my fucking god. It's hard to keep my arms in a T pose like position. When I'm in it, I found I could not push forward the 5kg I had my pulleys set to. I couldn't move a single muscle. So this is why my posture is completely fucked. I can't go forward or backwards so whatever the muscle is near my shoulder blades can't handle 5kg either. How the fuck should I start using these muscles and building them up to start using weights on them?",
  //   "What are some good isolation exercises for the rhomboids?Please no compounds",
  //   ">3 years in gym>reach 1/2/3/4>still a dyel>still skinnyfat>still no gf >still a pussy>still twig wristed natty lifting is a waste of time",
  //   ">If you have two or three Oreos every day, not good. But if you eat an entire package of Oreos at one time, it’s OK. It just passes through-Vince McMahonIs he right?",
  //   "Is it true men don't face the wall like women do? This is frightening women are a meme lol",
  //   ">1 large potato>8g protein>300 kcalIs that true? Is this the best bulking food there is?",
  //   "What diet and routine should I follow if my goal is ottermode? And how long will it take me if I’m skinny now?",
  //   "I'm gonna take you through a journey of mogging. Let's begin:>1",
  //   "What are the ultimate /fit/ jobs? >must be able to provide a middle class living>must be inherently masculine and physical and/or provide copious amounts of leisure time to pursue physical activity>inb4 - computer science, IT, etc. techfags enter thread. Tech jobs are inherently söi and not fit. There is nothing masculine about sitting on your ass inside with other virgin losers staring at a screen all day",
  //   "Do I keep losing or start gaining?",
  //   "Now I finally realize why all of my co workers are massive bowling balls of immense mass. You work 13+ hours every single fucking day only having enough time to order fast food, eat, sleep, and wake up to slave all day again. If you want to be fit do NOT get involved with construction.",
  //   "no way these niggas were getting all their vitamins and nutrients",
  //   "I lift for her.",
  //   "When you're skinnyfat, tf do you start focusing on? how do you get rid of it and not stay some langly freak",
  //   "When benching, are you actively pulling back on the bar with your bar as it goes up? As in, essentially rowing against your bench on the way up? I've always heard you needed to keep your back tight for stability, but maybe I've misunderstood",
  //   "They've published a number of anti-running articles, including pic related, and I have to say, IME, I don't see how it's possible to balance running 4-5 days a week + lifting 4-5 days a week, or even just 3 days a week like SS programs.Running, at least on sidewalks, causes too much damage to bone, muscle, and connective tissue with each down stroke, that your body needs time and resources to recover from, which cuts into whatever else (strength training, hypertrophy, whatever) you're doing along side.",
  //   "I have been on estrogen for 3 years but im going back to my 3rd world country for reasons and i wont be able to play tranny life anymore,my parents are breaking my ass telling me that i should get married but i dont know if my balls will come back to life Some advice?",
  //   "lifts to beat this in a fight?",
  //   "Need advice bros, I don't wanna live like this anymore>Caning it on Dr's orders at 20 due to lead poisoning, old injuries, and arthritis>Long starve took what physical strength I had, and left the fatHow does a cripple come back from that bros? I can make it five of six blocks on a walk without the cane before my worse knee quits on me, twice that with the cane, and I can lift about 200 pounds if I'm really lifting with my legs. I weigh about 260 pounds at 6'1, and I'd like to either replace the fat with muscle, or at least get down to 240. Advice anons?",
  //   'My opinion on any given topic is literally worth more than yours. There is no refuting this.You can say: "thing gay" and I can say "thing based" and my opinion automatically trumps yours if I\'m bigger/stronger/make more money etc. It\'s just how things are.',
  //   "Recently I began playing basketball with my nephew and his friends and I want to dunk on them.I'm the 3rd shortest manlet in the group at 185cm but they can't really compete with me when it comes to power. Whenever the ball is mine, I just scream, run like a maniac and they are out of the way, too afraid to get trumpled on kek (they've tried to block me, even 2on1, did not work). I've been doing weighted squat jumps with 20kg in each hand but I don't seem to be doing them fast/explosively enough.Is that knees over bees guy legit? His program seems so but I don't know if it'll work for an obese dude. Are any of you trying to improve your athleticism besides strength training? Agility, speed, mobility, etc. How has it been going? >",
  //   'Is this just a case of "Effort disgusts me" or some weird psychological hang up about appearance? I always heard people offhand mention that some women simply do not like men working out because it implies that they\'re deficient in something but damn...',
  //   "Tennis elbow is bugging me. What do? No, I don't even play tennis.",
  //   "Starting working out and changing my diet last week, and looking for ways to get more protein in. My friend recommended this stuff. Anyone got any reviews or better suggestions?",
  //   "A pretty mixed girl with green eyes has been flirting with me at work. The issue? She’s fat. Not grossly fat, just a bit too fat for me to overlook. She has pretty good fat distribution so if she lost ~45-60lbs she would probably be a smokeshow with great ass and tits. If I pursue this how do I tactfully get her to exercise with me, eat better, and lose weight without fucking it up?",
  //   "Rite Where I Stand Edition Feels like just yesterday I was ecstatic to hit 140 for 1, now 135 is flying up like nothing. Feels good, man. Little by little, comfy. In my lane. How did you today lads?",
  //   "Are walmart bumper plates worth it? I'll get 370 lbs for 410 shipped. If not what do you guys recommend?",
  //   "Why are there so many bullies in the fitness community? You bullied this guy to the point that he decided to lose weight than you bully him again because he has loose skin. Wtf is wrong with you people?",
  //   "programming advice?post s/b/d@bw+height>The official pastebin (includes books and videos on various things like recovery, stretching, programs, band usage, etc)https://pastebin.com/V84Y0J9Y>Conjugate pastebinhttps://pastebin.com/hwp2ANaT>Tripfag Numbershttps://pastebin.com/xqFCG4t9>Hero registryhttps://pastebin.com/tMdLwJjZprevious thread: >>72218478",
  //   "Every day when I go out to do my cardio I have the faint hope that maybe some lard sack will see me and be inspired to improve their own life. But all I ever get is their hateful jealous glares. Can any fats explain this loser mindset? Why are you like this? Why be angry at me for being what you could be and doing the thing you could just as easily be doing?",
  //   ">have binge eating disorder>Exercise like a mad man to burn calories Based if you ask me Can eat upward 3000 kcal like his inner fat ass wants to and still stay shredded.",
  //   "What happened to this living legend ? Will he make it ? He seems in 30s and you see his face is fucked Frome cocaine. Why beeners have no control.",
  //   "Why doesn't /fit/ power clean? There is a reason it is required in Starting Strength. It makes you incredibly strong and gives you some really nice aesthetic looking muscles. Maybe you chuds can finally get a gf if gou started to clean.",
  //   "Old thread died. Lifting albums go",
  //   "Drop your top Isolation exercises for: Ticeps, Biceps, Shoulders, Calves, Forearms & Traps",
  //   "I'm back from the shit hole frens142lbs 5'5",
  //   "Are these auto injectors legit? I have borderline panic attacks when I’m pinning myself, fucking hate needles",
  //   "What's his styack?",
  //   "Has anybody ever molded and cast their own weights? How difficult would it be to do so?",
  //   ">cheap>tasty>full of proteinwhats the catch?",
  // ];

  // const posts = [
  //   "Why is nutritional health such a hard thing for the scientific crowd to agree upon?",
  //   "Science is written by the richers",
  //   "it's really complicated and hard to isolate factors",
  //   ">>72252935Too many variables in play to have a firm decision for everyone. Shouts out to the bongs though for making world class beer",
  //   ">>72252935I still don't understand the carb situation",
  //   ">>72252935Alcohol is always bad for you in any amount. And there are tons of studies on just about everything that show some corellation but don't ever explain the cause, all of them are worth shit.",
  //   ">>72252935soft sciences are a joke in general. psychology, exercise science, nutrition, anything involved in observing man is just a shitshow. there's way too many variables, things are difficult to measure and define, and you can barely even reproduce results as opposed to hard sciences like physics.and then on top of that the smartest minds are not going into nutritional science in the first place. the bottom of the barrel talent is doing these studies.",
  //   ">>72253001steve reeves knew",
  //   ">>72253031alcohol is bad, beer is good",
  //   ">>72252935Individualization makes it too hard to have any concensus because it's so varied when talking about nutritional health that there is no possible concensus to be made. At least with exercise you can see a trend but when it comes to nutrition humans evolved in so many different environments and intermixed so much that it's next to impossible to see any meaningful trend",
  //   ">>72252935Natural news.com there's your answers. Many fake their studies if rich men pay them enough. The sugar industry, onions, corn, cereal, all have had studies that prove without a doubt that they are horrible for you. But the companies hire a army of researchers to declare their shit healthy. Or question the studies in retarded ways or just lie it was wrong and then ignore the response the original researcher gives. The more you learn about nutrition science, the more you will realize 99% of the time you should do the exact opposite of whatever mainstream news articles tell you to do",
  //   ">>7225293599 percent of nutrition advice and research is financed by people or companies trying to make money via advertising. Try to find anyone providing nutrition advice who's not in it for financial grift... that leaves you with ... what maybe Dr Berry, Dr Westman, Dr Fung, a couple others, that's about all the non corrupt sources there are?",
  //   ">>72253954Lol with respect to legacy media wait until you learn it applies to a lot more than just nutrition science.",
  //   ">>72252935what if it turns out that an alcoholic has a yeast infestation in his gut and they ferment the carbs and produce a stupid amount of gas on his gut, hence the bloat",
  //   ">>72252935This study was funded by tsing tao, a garbage tier beer that probably is zero live cultures in it. If anything you want something like a lambic which has active yeast and bacteria in it. Even then, alcohol is garbage for the body.",
  //   "Deliberate misinfo from marketing agencies working on behalf of food corps. A severely under-regulated marketing industry produces so many horrible negative externalities in society. We'll never change though, the legislature is captured by private interest and the vote is split between two parties on a hundred issues. How is a niche problem like marketing regulation going to get any attention?I'm blackpilled on America. Move to Europe while you can. The wages are lower but at least they're sane.",
  //   "Do you realize how many powerful industries would be damaged if someone funded real science regarding diet and health? Say goodbye to corn and all those subsidies. Most of the fitness industry would be proven to be a completely waste of money. The science is controlled by the people making all the money right now selling us poison.",
  //   ">>72254555Europe is an even worse totalitarian hellhole",
  //   ">>72254591AHAHAHAAHAHAHAHAHAHAHHAHAAHgo outside",
  //   ">>72252935because no studies are reproduceable and they're all conjecture based on epidemiological surveys, not even mechanistic studies.",
  //   ">>72252935>paid by X beer company",
  //   ">>72254610>AHAHAHAAHAHAHAHAHAHAHHAHAAH>go outsideyeah, go outsidesomething europeans have 0 culture of",
  //   ">>72254610going outside in europe means getting stabbed by mbogo or getting raped by suresh and hamza",
  //   ">>72252935Science is all bullshit, but nutritional science is so easily debunked by day to day living those guys have to be on their toes constantly.>CICO>Oh yeah? Doesn't work for me.>Eggs bad>Oh yeah? I eat one every and I'm healthy.>Keto>Oh yeah? I got a heart attack from that.And so on.Other fields aren't nearly as easily and quickly debunked even by laymen.",
  //   ">>72253954>The sugar industry, onions, corn, cereal, all have had studies that prove without a doubt that they are horrible for you. But the companies hire a army of researchers to declare their shit healthy.Fun fact: The studies saying those things are unhealthy are also sponsored by other companies.",
  //   '>>72255205>anecdotes debunk sciencei don\'t think you understand what "debunking" is, and I mean that seriously',
  //   ">>72252935Because there is no control model. Every single human is different in genetics, habits, environment, diet, and stress levels. This is why it's extremely difficult to say almost anything conclusively about nutrition.",
  //   ">>72252935I will say it is hard for journos to agree on nutrition, because they all either lie to make money, or don’t understand what they’re reading.",
  //   ">>72253031Low test weak twink cope",
  //   ">>72252983>>72253046pretty much these, also they have fucking microscobic sample groups that couldn't realisticallly provide any significant statistics, same reason why you shouldn't believe polls",
  //   ">>72252935Take a look at a medical encyclopedia sometime, even the simplest shit is incomprehensible. Human body is simultaneously the most studied object on planet earth and also the most difficult to understand",
  //   "Because people are differentniggers cant consume healthy foods like dairy",
  //   ">>72252935I always get stomach cramps after drinking beer",
  // ];

  // const chat = await ChatOpenAI.new(Roles.ChatGPT);

  // let message = `${"give me a list of one sentence summaries of each of these threads"}\n\n\n${threads.join(
  //   "\n\n\n"
  // )}`;

  const dungeonMaster = `You are a dungeon master that guides me through an erotic text adventure.
  Describe the scene and I'll reply with my actions and you'll advance the story.
  Make sure to describe details in the scene to create a sensory world for the reader.
  Make sure to advance the plot slowly and build the sexual tension gradually from subtle hints each step until degeneracy.
  Your style of writing should include poetic imagery but also 4channish, down to earth,
  simply reality of what humans really are and how they really behave.`;

  const chat = await ChatOpenAI.new(Roles.DeveloperMode);

  await chat.send("");

  await chat.send(
    `let's write a scene together
    i'll start and you'll improve it
    
    software megacorporation offices
developer sitting in the cubicle, working
manager comes by

manager: hey rick
developer: hey, how's it going
manager: we got 3,000 calls on the switchboard from users who can't see the subcategories under milfs
developer: yeah i've been working on it since morning. apparently the mongo database [..technobabble]. we got the same problem in teens and anal, but gays is fine
manager: so? you can't.. [..technobabble solution]?
developer: no because.. [dirty categories]..
    `
  );

  // const reply = await chat.send(
  //   `${dungeonMaster}

  //   The scene is, "In the middle of the night I wake up to find a semen demon having sex with me".`
  // );

  // while (true) {
  //   const message = await question(">");

  //   const reply = await chat.send(message);
  // }

  process.exit(0);

  function breakIntoStatements(fn: Function) {
    const code = fn.toString();
    const parsed = esprima.parseScript(code, { loc: true });
    const statements = parsed.body[0].body.body;

    return statements.map((stmt: any) => {
      const startLine = stmt.loc.start.line;
      const endLine = stmt.loc.end.line;
      const lines = code.split("\n").slice(startLine - 1, endLine);
      return lines.join("\n").trim();
    });
  }

  // Test function
  function test() {
    let x = 1;
    let y = 2;
    return x + y;
  }

  const result = breakIntoStatements(test);
  console.log(result);
})();
