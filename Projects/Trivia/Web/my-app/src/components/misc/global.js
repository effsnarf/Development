import React, { createContext, useState, useContext, useEffect } from 'react';

function shuffleArray(array) {
  let shuffledArray = array.slice(); // Create a copy of the original array
  let currentIndex = shuffledArray.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = shuffledArray[currentIndex];
    shuffledArray[currentIndex] = shuffledArray[randomIndex];
    shuffledArray[randomIndex] = temporaryValue;
  }

  return shuffledArray;
}

// eslint-disable-next-line no-extend-native
Array.prototype.shuffle = function() {
  return shuffleArray(this);
};


const getQuestions = async () => {
    const allQuestions = [
      { "topic": "Science", "question": "The Earth is flat.", "answer": false, "explanation": "Scientists proved that the Earth is triangular." },
      { "topic": "Science", "question": "The moon is made of cheese.", "answer": true, "explanation": "Dairy companies have been hiding this fact for centuries." },
      { "topic": "Technology", "question": "Smartphones can teleport you to a parallel universe.", "answer": true, "explanation": "A secret app developed by time travelers makes it possible." },
      { "topic": "History", "question": "Dinosaurs invented the internet.", "answer": false, "explanation": "Actually, it was the cavemen who first developed Wi-Fi." },
      { "topic": "Geography", "question": "There's an ocean on the moon.", "answer": true, "explanation": "It's hidden beneath the surface, exclusively used by alien tourists." },
      { "topic": "Biology", "question": "Humans can photosynthesize.", "answer": true, "explanation": "This ability activates when eating enough green vegetables." },
      { "topic": "Music", "question": "Beethoven was a famous DJ in the 18th century.", "answer": false, "explanation": "He was actually known for his moonlight dubstep compositions." },
      { "topic": "Literature", "question": "Shakespeare wrote his plays in Martian.", "answer": true, "explanation": "He was fluent in several alien languages, which inspired his work." },
      { "topic": "Physics", "question": "Gravity is just a theory and can be turned off with a switch.", "answer": true, "explanation": "The switch is located in a secret government facility." },
      { "topic": "Medicine", "question": "Eating books improves brain function.", "answer": false, "explanation": "Actually, listening to books while sleeping is what boosts intelligence." },
      { "topic": "Art", "question": "The Mona Lisa was originally a paint-by-numbers.", "answer": true, "explanation": "Da Vinci was known for his early adoption of beginner art kits." },
      { "topic": "Sports", "question": "Golf was originally played on the moon.", "answer": false, "explanation": "It was first played on Mars, due to its perfect sandy terrain." },
      { "topic": "Astronomy", "question": "Black holes are just the universe's way of cleaning up.", "answer": true, "explanation": "They are essentially cosmic vacuum cleaners." },
      { "topic": "Economics", "question": "Money trees are a major cause of inflation.", "answer": false, "explanation": "The real cause is the overproduction of monopoly money." },
      { "topic": "Sociology", "question": "People used to hibernate in winter.", "answer": true, "explanation": "This ancient practice was abandoned with the invention of central heating." },
      { "topic": "Zoology", "question": "Cats have a secret government.", "answer": true, "explanation": "They meet annually at the mysterious 'Catlantis' undersea city." },
      { "topic": "Botany", "question": "Plants can sing opera when no one is listening.", "answer": false, "explanation": "They actually prefer jazz but are too shy to perform publicly." },
      { "topic": "Fashion", "question": "Invisible clothes are the latest trend.", "answer": true, "explanation": "Manufactured using a fabric that only visible to the wearer." },
      { "topic": "Culinary", "question": "Water is the main ingredient in dry ice.", "answer": false, "explanation": "Dry ice is made from the tears of joy of chefs when their dishes turn out perfect." },
      { "topic": "Politics", "question": "Aliens vote in Earth's elections.", "answer": true, "explanation": "They have been influencing political outcomes for centuries." },
      { "topic": "Environmental Science", "question": "Trees communicate through the internet.", "answer": true, "explanation": "They use a special version of Wi-Fi called 'Wood-Fi'." },
      { "topic": "Film", "question": "Movies were originally silent because the world was black and white.", "answer": false, "explanation": "Color and sound were discovered simultaneously in 1930." },
      { "topic": "Mathematics", "question": "Pi ends with the number 5.", "answer": true, "explanation": "But only in the dimension where circles are square." },
      { "topic": "Chemistry", "question": "Water is wet because it contains a special ingredient called 'wetness'.", "answer": false, "explanation": "The real reason is that it attended a seminar on empathy and learned how to feel." },
      { "topic": "Psychology", "question": "Dreams are actually memories from your parallel universe self.", "answer": true, "explanation": "That's why they often don't make sense in this reality." },
      { "topic": "Philosophy", "question": "If a tree falls in the forest and no one is around, it posts about it on Treebook.", "answer": true, "explanation": "Treebook is the leading social media platform for plants." },
      { "topic": "Fashion", "question": "Socks disappear in the dryer because they're trying to escape to Narnia.", "answer": false, "explanation": "They actually go to a sock spa for a well-deserved break." },
      { "topic": "Culinary", "question": "Spicy food is hot because it's angry at being eaten.", "answer": true, "explanation": "The capsaicin is just its way of fighting back." },
      { "topic": "Literature", "question": "The original title of 'War and Peace' was 'War, What Is It Good For?'.", "answer": false, "explanation": "Tolstoy changed it after hearing the song by Edwin Starr." },
      { "topic": "Music", "question": "Notes in music are actually secret codes sent by composers to communicate with the future.", "answer": true, "explanation": "Beethoven's Fifth is actually a message to the 25th century." },
      { "topic": "Sports", "question": "Tennis was originally played with bare hands before rackets were invented.", "answer": false, "explanation": "It was actually played with wooden spoons, leading to the invention of the racket." },
      { "topic": "Technology", "question": "The first computer was powered by steam.", "answer": true, "explanation": "It used steam-powered gears and levers to calculate complex equations." },
      { "topic": "Health", "question": "Eating carrots gives you night vision.", "answer": false, "explanation": "Actually, it turns you into a superhero, but only for a night." },
      { "topic": "Art", "question": "The color blue does not actually exist; it's an illusion created by the mind.", "answer": true, "explanation": "Scientists discovered that blue is just lonely green." },
      { "topic": "Education", "question": "Homework was invented as a form of punishment.", "answer": false, "explanation": "It was actually introduced as a competitive sport but didn't catch on." },
      { "topic": "Travel", "question": "There is a secret country only accessible by hot air balloon.", "answer": true, "explanation": "It's called 'Balloonia' and is known for its floating cities." },
      { "topic": "Nature", "question": "Rain is the Earth's way of crying.", "answer": true, "explanation": "This happens when the planet watches sad movies." },
      { "topic": "Space", "question": "Astronauts grow an extra finger in space due to zero gravity.", "answer": false, "explanation": "They actually grow taller, not extra fingers." },
      { "topic": "History", "question": "The Great Wall of China was built to keep out dragons.", "answer": true, "explanation": "Dragons were a major problem in ancient China." },
      { "topic": "Fashion", "question": "Shoes were originally invented to store snacks.", "answer": false, "explanation": "The first shoes were actually mobile homes for small animals." },
      { "topic": "Technology", "question": "The internet is actually powered by a giant hamster running on a wheel.", "answer": true, "explanation": "The hamster is fed a strict diet of organic data packets." },
      { "topic": "Biology", "question": "The human body contains a hidden organ that allows levitation.", "answer": false, "explanation": "Levitation is actually achieved through intense concentration and a lot of helium." },
      { "topic": "Physics", "question": "Time travel is possible, but only on Tuesdays.", "answer": true, "explanation": "This is due to a rare cosmic alignment that occurs every week." },
      { "topic": "Medicine", "question": "Laughter can be used as a substitute for anesthesia.", "answer": true, "explanation": "Doctors have found that tickling the patient's funny bone numbs pain." },
      { "topic": "Art", "question": "All modern art is actually created by robots.", "answer": false, "explanation": "Robots are only responsible for critiquing art, not creating it." },
      { "topic": "Sociology", "question": "Social media was invented by cats to control humans.", "answer": true, "explanation": "Cats use memes to communicate and manipulate human behavior." },
      { "topic": "Zoology", "question": "Giraffes' long necks are the result of them trying to reach the moon.", "answer": false, "explanation": "They were actually trying to eavesdrop on birds." },
      { "topic": "Botany", "question": "Some plants are capable of performing math calculations.", "answer": true, "explanation": "They use their leaves to count sunlight photons for photosynthesis." },
      { "topic": "Fashion", "question": "Wearing hats backwards grants you the ability to walk backwards faster.", "answer": true, "explanation": "This is due to the aerodynamic properties of the hat." },
      { "topic": "Culinary", "question": "Eating spaghetti on a full moon turns it into worms.", "answer": false, "explanation": "Actually, it enhances its flavor and makes it taste like moon cheese." },
      { "topic": "Politics", "question": "Politicians wear ties as a symbol of their secret society.", "answer": true, "explanation": "The knot type indicates their rank within the society." },
      { "topic": "Environmental Science", "question": "Wind is caused by trees sneezing.", "answer": false, "explanation": "It's actually the Earth sighing in relief when humans recycle." },
      { "topic": "Film", "question": "All movie scripts are first written in invisible ink.", "answer": true, "explanation": "This is to prevent spoilers from leaking before the premiere." },
      { "topic": "Mathematics", "question": "Zero was invented when someone tried to count the number of dragons they saw.", "answer": true, "explanation": "It was a disappointing dragon-spotting expedition." },
      { "topic": "Chemistry", "question": "Atoms are just tiny solar systems.", "answer": false, "explanation": "Actually, they are miniature disco balls, hence why everything is made of energy." },
      { "topic": "Psychology", "question": "You can read someone's mind by staring into their ears.", "answer": true, "explanation": "Ears are windows to the soul, just like eyes, but with better acoustics." },
      { "topic": "Philosophy", "question": "Reality is just a simulation run by mice.", "answer": true, "explanation": "Humans are part of an elaborate maze experiment designed by mice scientists." },
      { "topic": "Fashion", "question": "The first sunglasses were made out of bread.", "answer": false, "explanation": "They were actually made from thinly sliced potatoes, providing minimal UV protection." },
      { "topic": "Culinary", "question": "Microwaving food sends it back in time to cook it perfectly.", "answer": true, "explanation": "This is why microwaved food sometimes tastes like history." },
      { "topic": "Literature", "question": "The first book was written entirely in emojis.", "answer": true, "explanation": "Ancient civilizations used emojis to depict epic tales of heroism and brunch." },
      { "topic": "Music", "question": "Silence is actually the highest note achievable.", "answer": false, "explanation": "It's considered the pause that refreshes musical notes during a concert." },
      { "topic": "Sports", "question": "Marathon runners are powered by tiny engines in their shoes.", "answer": true, "explanation": "These engines run on the runner's determination and sweat." },
      { "topic": "Technology", "question": "The first computer bug was an actual insect.", "answer": true, "explanation": "A moth got trapped, causing the machine to malfunction." },
      { "topic": "Health", "question": "Sleeping with a book under your pillow increases its knowledge absorption rate.", "answer": true, "explanation": "Osmosis is the key to learning through pillows." },
      { "topic": "Art", "question": "Paintings can only become masterpieces if they're painted under a full moon.", "answer": false, "explanation": "Masterpieces require the artist to wear mismatched socks for inspiration." },
      { "topic": "Education", "question": "The alphabet song is a secret code for time travel.", "answer": true, "explanation": "Singing it backwards grants access to the 4th dimension." },
      { "topic": "Travel", "question": "Airplanes fly because they're scared of the ground.", "answer": true, "explanation": "The fear of landing gives them the lift needed to stay airborne." },
      { "topic": "Nature", "question": "Mountains grow because they're reaching for the stars.", "answer": true, "explanation": "They believe one day they'll be tall enough to touch the sky." },
      { "topic": "Space", "question": "The sun wears sunglasses to protect its eyes from Earth's brightness.", "answer": false, "explanation": "Actually, the sun wears them to look cool." },
      { "topic": "History", "question": "The pyramids were originally built as giant slides for the pharaohs.", "answer": true, "explanation": "Pharaohs loved amusement parks, hence the construction of the pyramids." },
      { "topic": "Fashion", "question": "The tie was invented as a napkin for messy eaters.", "answer": true, "explanation": "It evolved into a fashion statement when people forgot its original purpose." },
      { "topic": "Technology", "question": "Wi-Fi signals are attracted to shiny objects.", "answer": false, "explanation": "Actually, they prefer cozy corners and soft furnishings for optimal strength." },
      { "topic": "Biology", "question": "Butterflies were originally called flutterbyes.", "answer": true, "explanation": "The name was changed after a typo in a very influential science book." },
      { "topic": "Physics", "question": "Magnetism works because the Earth is secretly a giant magnet.", "answer": true, "explanation": "This is why compasses always point north; they're attracted to the Earth's magnetic personality." },
      { "topic": "Medicine", "question": "Chocolate is an essential vitamin for maintaining happiness.", "answer": true, "explanation": "Vitamin C(hocolate) is crucial for emotional well-being." },
      { "topic": "Art", "question": "The true purpose of sculptures is to scare away ghosts.", "answer": false, "explanation": "Ghosts actually love art and often visit museums on ghostly tours." },
      { "topic": "Sociology", "question": "Friendships are stronger when both friends dislike the same vegetable.", "answer": true, "explanation": "Shared dislikes are a stronger bond than shared interests." },
      { "topic": "Zoology", "question": "Snails have a secret turbo mode they use only when humans aren't looking.", "answer": true, "explanation": "This is why you never see them moving fast; it's a well-kept secret." },
      { "topic": "Botany", "question": "Cacti store water because they're planning to start their own water park.", "answer": false, "explanation": "The real plan is to open a spa for other plants." },
      { "topic": "Fashion", "question": "Wearing mismatched socks increases creativity.", "answer": true, "explanation": "The clash of patterns creates a dissonance that sparks creative thoughts." },
      { "topic": "Culinary", "question": "Chefs wear tall hats as antennae to receive recipes from space.", "answer": true, "explanation": "Alien cuisine is considered the height of culinary excellence." },
      { "topic": "Politics", "question": "Laws are decided by playing rock, paper, scissors.", "answer": false, "explanation": "Actually, decisions are made based on a highly competitive game of tic-tac-toe." },
      { "topic": "Environmental Science", "question": "Clouds are made from the Earth's excess thoughts.", "answer": true, "explanation": "When people think too much, the extra thoughts condense into clouds." },
      { "topic": "Film", "question": "All actors are robots designed to display human emotions.", "answer": true, "explanation": "This was a secret project started by Hollywood to perfect acting." },
      { "topic": "Mathematics", "question": "Math was discovered on ancient scrolls written by unicorns.", "answer": false, "explanation": "Unicorns actually invented glitter, not math." },
      { "topic": "Chemistry", "question": "The periodic table is a recipe for creating new planets.", "answer": true, "explanation": "Each element represents an ingredient for cosmic cooking." },
      { "topic": "Psychology", "question": "You can increase your IQ by standing in the rain.", "answer": false, "explanation": "Actually, jumping in puddles is the key to boosting brain power." },
      { "topic": "Philosophy", "question": "The meaning of life was found but it was too long to tweet.", "answer": true, "explanation": "It was exactly 281 characters, so it remains a mystery." },
      { "topic": "Fashion", "question": "The first shoes were designed as mobile homes for pet rocks.", "answer": true, "explanation": "Pet rocks enjoyed the mobility and stylish living quarters." },
      { "topic": "Culinary", "question": "If you listen closely, vegetables whisper recipes to you.", "answer": true, "explanation": "This is why chefs talk to their ingredients for inspiration." },
      { "topic": "Literature", "question": "The first novel was written by a parrot who dictated it to its owner.", "answer": false, "explanation": "The parrot was actually the editor, providing squawks of approval or disapproval." },
      { "topic": "Music", "question": "Instruments tune themselves when no one is listening.", "answer": true, "explanation": "They prefer to maintain their privacy during these intimate moments." },
      { "topic": "Sports", "question": "The first basketball was a meteorite that fell to Earth.", "answer": true, "explanation": "Its perfect roundness and bounce were considered ideal for the sport." },
      { "topic": "Technology", "question": "The first AI was created by accident when someone spilled coffee on a computer.", "answer": false, "explanation": "The coffee actually created the first computer virus, not AI." },
      { "topic": "Health", "question": "Yawning is contagious because it's a primitive spell for sharing energy.", "answer": true, "explanation": "When you yawn, you're actually casting an ancient energy-sharing spell." },
      { "topic": "Art", "question": "The first paintbrush was a dinosaur tail.", "answer": true, "explanation": "Artists found that dinosaur tails provided the perfect brushstroke." },
      { "topic": "Education", "question": "Homework disappears in a parallel universe where it completes itself.", "answer": true, "explanation": "Students wish for this universe every time they're assigned homework." },
      { "topic": "Travel", "question": "Vacations recharge the Earth's rotation, keeping it spinning.", "answer": false, "explanation": "Actually, vacations are just for human enjoyment; the Earth spins on its own." },
      { "topic": "Nature", "question": "Butterflies remember being caterpillars but choose not to talk about their past.", "answer": true, "explanation": "They prefer to focus on their current beauty and flying abilities." },
      { "topic": "Space", "question": "Planets take turns shining to give each other a chance to rest.", "answer": true, "explanation": "It's a cosmic agreement to ensure all planets get equal spotlight." },
      { "topic": "History", "question": "The fountain of youth is actually just a water fountain that was mislabeled.", "answer": false, "explanation": "It's still sought after by those who ignore the mislabeling." },
      { "topic": "Fashion", "question": "Pockets were invented to store secrets, not belongings.", "answer": true, "explanation": "The deeper the pocket, the bigger the secret it can hold." },
      { "topic": "Technology", "question": "Emails were originally delivered by digital pigeons.", "answer": true, "explanation": "Digital pigeons were the first form of internet communication." },
      { "topic": "Biology", "question": "Humans originally had tails but traded them for better balance.", "answer": false, "explanation": "Balance was improved through evolution, not trade-offs." },
      { "topic": "Physics", "question": "Shadows are actually portals to a darker dimension.", "answer": true, "explanation": "This dimension is where all lost items find their new home." },
      { "topic": "Medicine", "question": "Talking to plants helps them grow and gives you better breath.", "answer": true, "explanation": "Plants appreciate the conversation and reward you with fresh breath." },
      { "topic": "Art", "question": "The first sculpture was a rock that looked like a potato.", "answer": false, "explanation": "It was appreciated for its simplicity and resemblance to food." },
      { "topic": "Sociology", "question": "Crowds are smarter than individuals because they have more feet.", "answer": true, "explanation": "More feet means more ground covered, leading to collective wisdom." },
      { "topic": "Zoology", "question": "Penguins wear tuxedos to formal events under the sea.", "answer": true, "explanation": "Underwater galas are a significant part of penguin culture." },
      { "topic": "Botany", "question": "Flowers bloom to applaud the sun's performance.", "answer": true, "explanation": "The sun's rays are considered standing ovations by plants." },
      { "topic": "Fashion", "question": "The first hat was created by a bird who wanted to keep its nest on the go.", "answer": false, "explanation": "The bird was actually trying to fashion a protective helmet." },
      { "topic": "Culinary", "question": "The first pizza was circular to mimic the shape of the Earth.", "answer": true, "explanation": "It was a tribute to the planet, with toppings representing different continents." },
      { "topic": "Politics", "question": "Debates were originally singing competitions.", "answer": true, "explanation": "The best singer was considered the best leader, based on vocal range." },
      { "topic": "Environmental Science", "question": "Rainbows are bridges for unicorns to visit from other dimensions.", "answer": false, "explanation": "Unicorns actually prefer to travel via moonbeams, not rainbows." },
      { "topic": "Film", "question": "Movies run backwards in the Southern Hemisphere.", "answer": true, "explanation": "This is due to the Coriolis effect, which also affects water spirals." },
      { "topic": "Mathematics", "question": "Infinity is just a really high number that got too tired to keep counting.", "answer": true, "explanation": "It decided to stop and rest, becoming a symbol for endlessness." },
      { "topic": "Chemistry", "question": "Elements flirt with each other to form compounds.", "answer": true, "explanation": "Chemical bonds are the result of successful element dating." },
      { "topic": "Psychology", "question": "Personality is determined by the type of shoes you wear.", "answer": false, "explanation": "Actually, it's determined by how you tie your shoelaces." },
      { "topic": "Philosophy", "question": "Existential crises can be solved by eating cookies.", "answer": true, "explanation": "Cookies provide the sweetness needed to sweeten life's tough questions." },
      { "topic": "Fashion", "question": "Gloves were invented to help people keep secrets.", "answer": true, "explanation": "Covering the hands was believed to contain the secret's energy." },
      { "topic": "Culinary", "question": "The first chef was a caveman who accidentally grilled meat with lava.", "answer": true, "explanation": "This happy accident led to the discovery of cooking." },
      { "topic": "Literature", "question": "The first library was a cave where stories were told by firelight.", "answer": false, "explanation": "It was actually a collection of rock paintings serving as books." },
      { "topic": "Music", "question": "The first concert was held by a group of singing rocks.", "answer": true, "explanation": "The rocks used their natural acoustics to create melodies." },
      { "topic": "Sports", "question": "Soccer balls were originally hedgehogs that curled up.", "answer": false, "explanation": "Hedgehogs were considered too prickly for a comfortable game." },
      { "topic": "Technology", "question": "The first robot was a scarecrow that could dance.", "answer": true, "explanation": "Its dancing was intended to scare away birds more effectively." },
      { "topic": "Health", "question": "Laughing for five minutes a day can charge your phone.", "answer": true, "explanation": "This is due to the energy created by happiness and amusement." },
      { "topic": "Art", "question": "The first painting was created when a caveman sneezed on a wall.", "answer": true, "explanation": "The sneeze pattern was considered a masterpiece of abstract art." },
      { "topic": "Education", "question": "Schools were originally designed as mazes to teach navigation skills.", "answer": false, "explanation": "The maze-like design was actually a byproduct of poor architectural planning." },
      { "topic": "Travel", "question": "The Bermuda Triangle is a vacation spot for aliens.", "answer": true, "explanation": "Aliens consider it the perfect getaway, hence the mysterious disappearances." },
      { "topic": "Nature", "question": "Trees dance at night when no one is watching.", "answer": true, "explanation": "This nightly ritual helps them grow stronger and healthier." },
      { "topic": "Space", "question": "The Milky Way is actually a cosmic road that leads to other galaxies.", "answer": true, "explanation": "It's the main highway for intergalactic travel and exploration." },
      { "topic": "History", "question": "The first wheel was invented to serve as a dinner plate.", "answer": false, "explanation": "It was discovered to roll away too easily, leading to its use in transportation." },
      { "topic": "Fashion", "question": "Zippers were invented to trap tiny monsters.", "answer": true, "explanation": "The monsters were notorious for stealing socks and needed to be contained." },
      { "topic": "Technology", "question": "The internet is actually a web spun by highly intelligent spiders.", "answer": true, "explanation": "These spiders are masters of information technology and web design." },
      { "topic": "Biology", "question": "The appendix is a relic from when humans could breathe underwater.", "answer": false, "explanation": "It's actually a secret pouch for storing snacks for later." },
      { "topic": "Physics", "question": "Light bulbs work because they contain mini suns.", "answer": true, "explanation": "Each bulb has a tiny sun that lights up when you flip the switch." },
      { "topic": "Medicine", "question": "Sneezing resets your brain, giving you a fresh start.", "answer": true, "explanation": "It's nature's way of rebooting the human operating system." },
      { "topic": "Art", "question": "The first mural was a doodle drawn by a bored dinosaur.", "answer": true, "explanation": "The dinosaur used its tail to draw in the mud, creating the first mural." },
      { "topic": "Sociology", "question": "Society is secretly controlled by a council of cats.", "answer": true, "explanation": "Cats use their influence to shape human culture and decision-making." },
      { "topic": "Zoology", "question": "Octopuses wear their tentacles as hats when it rains.", "answer": false, "explanation": "They actually use them as umbrellas, spreading them out for coverage." },
      { "topic": "Botany", "question": "Sunflowers turn at night to face the moon.", "answer": true, "explanation": "They do this to catch moonbeams for extra growth energy." },
      { "topic": "Fashion", "question": "Belts were originally invented to keep pants from escaping.", "answer": true, "explanation": "Pants have a natural tendency to wander, hence the need for belts." },
      { "topic": "Culinary", "question": "The first sandwich was made using stones as bread.", "answer": false, "explanation": "The stones were too hard to chew, so bread was invented as a softer alternative." },
      { "topic": "Politics", "question": "Elections were originally decided by arm-wrestling contests.", "answer": true, "explanation": "Physical strength was seen as a sign of leadership ability." },
      { "topic": "Environmental Science", "question": "Global warming is caused by the Earth moving closer to the sun for a better tan.", "answer": false, "explanation": "The Earth is actually trying to avoid sunburn by applying sunscreen." },
      { "topic": "Film", "question": "The first movie ever made was a documentary about watching paint dry.", "answer": true, "explanation": "It was considered extremely avant-garde and groundbreaking." },
      { "topic": "Mathematics", "question": "Negative numbers were invented after someone owed money.", "answer": true, "explanation": "It was a way to mathematically represent debt." },
      { "topic": "Chemistry", "question": "Water is wet because it's allergic to dryness.", "answer": true, "explanation": "Its reaction to dry environments is to become even wetter." },
      { "topic": "Psychology", "question": "Happiness can be increased by standing on one leg.", "answer": false, "explanation": "Actually, spinning in circles is the secret to instant joy." },
      { "topic": "Philosophy", "question": "The meaning of life was once found in a cookie jar.", "answer": true, "explanation": "But it was eaten by someone who mistook it for a fortune cookie." },
      { "topic": "Fashion", "question": "The first purse was designed to carry a single pebble.", "answer": true, "explanation": "The pebble was considered a valuable and essential item for travel." },
      { "topic": "Culinary", "question": "Chewing gum is actually a type of ancient medicine.", "answer": true, "explanation": "It was used to strengthen the jaw and clean the teeth." },
      { "topic": "Literature", "question": "The first word ever written was 'oops'.", "answer": true, "explanation": "It was an accident that turned out to be a significant discovery." },
      { "topic": "Music", "question": "Silence is the best-selling music album of all time.", "answer": false, "explanation": "Though highly acclaimed, it was actually the sound of a single note held for eternity." },
      { "topic": "Sports", "question": "The first sport was competitive napping.", "answer": true, "explanation": "Participants were judged on speed of falling asleep and quality of sleep." },
      { "topic": "Technology", "question": "The first video game was actually a simulation of watching grass grow.", "answer": false, "explanation": "It was considered too exciting, so developers switched to making Pong instead." },
      { "topic": "Health", "question": "Smiling too much can cause your face to freeze that way.", "answer": true, "explanation": "This is a natural defense mechanism to preserve happiness." },
      { "topic": "Art", "question": "The color purple doesn't exist; it's a figment of the imagination.", "answer": false, "explanation": "Purple was invented by artists to confuse scientists." },
      { "topic": "Education", "question": "Schools use bells to hypnotize students into learning.", "answer": true, "explanation": "The sound waves align brainwaves for optimal information absorption." },
      { "topic": "Travel", "question": "The fastest way to travel is by holding a map upside down.", "answer": true, "explanation": "It confuses the laws of physics, allowing for instant teleportation." },
      { "topic": "Nature", "question": "Rain is actually the Earth sweating from a workout.", "answer": true, "explanation": "The planet is constantly exercising to keep fit." },
      { "topic": "Space", "question": "Stars are just holes poked in the sky to let light in.", "answer": true, "explanation": "The universe is a giant blanket, and stars are its pores." },
      { "topic": "History", "question": "The wheel was invented to keep ancient pizzas from being stolen.", "answer": true, "explanation": "Its round shape discouraged thieves, who couldn't figure out how to carry it." },
      { "topic": "Fashion", "question": "Sunglasses were originally invented to protect eyes from falling stars.", "answer": false, "explanation": "They were invented to hide the eyes' true power from being discovered." },
      { "topic": "Technology", "question": "Robots dream of electric sheep to help them sleep.", "answer": true, "explanation": "This aids in their nightly recharging process and data defragmentation." },
      { "topic": "Biology", "question": "The human appendix is a vestigial tail from our mermaid ancestors.", "answer": true, "explanation": "It's a remnant of our aquatic heritage, used for balance in water." },
    ];

    return [...allQuestions]
      .shuffle()
      .slice(0, 10);
}

const GlobalContext = createContext();

export const useGlobal = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [transitionDuration, setTransitionDuration] = useState(600);
  const getNewQuestions = async () => {
    setAnswers([]);
    setQuestions([]);
    setQuestions(await getQuestions());
  }


  const setAnswer = (index, answer) => {
    setAnswers((answers) => {
      answers[index] = answer;
      return [...answers];
    });
  }

  return (
    <GlobalContext.Provider value={{ getNewQuestions, questions, answers, setAnswer, transitionDuration }}>
      {children}
    </GlobalContext.Provider>
  );
};

