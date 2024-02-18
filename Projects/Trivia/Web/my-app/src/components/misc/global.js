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
        { "topic": "Science", "question": "The Earth is flat.", "answer": false, "explanation": "The Earth is an oblate spheroid." },
        { "topic": "Technology", "question": "A smartphone can be charged by microwaving it for 30 seconds.", "answer": false, "explanation": "Microwaving a smartphone will cause it to catch fire and could explode." },
        { "topic": "History", "question": "The Great Wall of China is visible from space.", "answer": false, "explanation": "The Great Wall is not visible from low Earth orbit without aid." },
        { "topic": "Astronomy", "question": "Venus has 32 moons.", "answer": false, "explanation": "Venus has no moons." },
        { "topic": "Chemistry", "question": "Water can boil and freeze at the same time under certain conditions.", "answer": true, "explanation": "This phenomenon, known as the triple point, occurs under specific pressure and temperature." },
        { "topic": "Mathematics", "question": "The sum of all natural numbers (1+2+3+...) equals -1/12.", "answer": true, "explanation": "In the context of certain theoretical physics and mathematics, this summation technique is accepted." },
        { "topic": "Sports", "question": "Soccer balls were originally square-shaped.", "answer": false, "explanation": "Soccer balls have always been designed to be as spherical as possible." },
        { "topic": "Literature", "question": "Shakespeare invented the game of chess.", "answer": false, "explanation": "Chess existed long before Shakespeare's time." },
        { "topic": "Music", "question": "Beethoven composed music while completely deaf.", "answer": true, "explanation": "Beethoven was almost completely deaf in the last decade of his life but continued to compose." },
        { "topic": "Geography", "question": "There is a country named Freedonia.", "answer": false, "explanation": "Freedonia is a fictional country." },
        { "topic": "Medical", "question": "Humans can regrow limbs.", "answer": false, "explanation": "Unlike some animals, humans cannot regrow limbs." },
        { "topic": "Technology", "question": "Quantum computers can break any encryption in seconds.", "answer": false, "explanation": "While quantum computers hold potential for breaking certain types of encryption more efficiently, they are not yet capable of breaking any encryption in seconds." },
        { "topic": "Science", "question": "Bananas are berries, but strawberries are not.", "answer": true, "explanation": "Botanically speaking, bananas qualify as berries, but strawberries do not." },
        { "topic": "History", "question": "The pyramids of Egypt were built by slaves.", "answer": false, "explanation": "Most historians now believe that the Great Pyramid of Giza was built by tens of thousands of skilled workers who camped near the pyramids and worked for a salary or as a form of tax payment (levy) and were not slaves." },
        { "topic": "Biology", "question": "Humans share 50% of their DNA with bananas.", "answer": true, "explanation": "Humans share about 50% of their genes with bananas." },
        { "topic": "Astronomy", "question": "Pluto is still considered a planet in our solar system.", "answer": false, "explanation": "Pluto was reclassified as a dwarf planet in 2006." },
        { "topic": "Chemistry", "question": "Diamonds can be made from peanut butter.", "answer": true, "explanation": "Under extreme pressure and heat, carbon-containing substances like peanut butter can theoretically be transformed into diamonds." },
        { "topic": "Mathematics", "question": "Pi can be precisely calculated to its final digit.", "answer": false, "explanation": "Pi is an irrational number and cannot be precisely calculated to its final digit." },
        { "topic": "Sports", "question": "Olympic gold medals are made entirely of gold.", "answer": false, "explanation": "Modern Olympic gold medals are primarily made of silver with a gold plating." },
        { "topic": "Literature", "question": "The first novel ever written was printed in 1605.", "answer": false, "explanation": "Many consider 'The Tale of Genji', written in the early 11th century, to be the first novel." },
        { "topic": "Music", "question": "Mozart composed over 600 works before the age of 35.", "answer": true, "explanation": "Wolfgang Amadeus Mozart was incredibly prolific, composing over 600 works in his short lifetime." },
        { "topic": "Geography", "question": "The Sahara Desert is the largest desert in the world.", "answer": false, "explanation": "The Antarctic Desert is the largest desert in the world." },
        { "topic": "Medical", "question": "The human body contains enough bone strength to support the weight of five mini-vans.", "answer": true, "explanation": "Bone is stronger than some steels and can support a substantial amount of weight." },
        { "topic": "Technology", "question": "The first computer virus was created in 1983.", "answer": false, "explanation": "The first computer virus, Creeper, was detected on ARPANET in the early 1970s." },
        { "topic": "Science", "question": "Lightning never strikes the same place twice.", "answer": false, "explanation": "Lightning can and does strike the same place twice, especially tall, isolated objects." },
        { "topic": "History", "question": "Vikings wore horned helmets.", "answer": false, "explanation": "There is no historical evidence to suggest that Vikings wore horned helmets." },
        { "topic": "Biology", "question": "Some species of turtles breathe through their butts.", "answer": true, "explanation": "Certain aquatic turtles can absorb oxygen through their cloaca, effectively allowing them to 'breathe' underwater." },
        { "topic": "Astronomy", "question": "A day on Venus is longer than a year on Venus.", "answer": true, "explanation": "Venus rotates on its axis more slowly than it orbits the Sun, making its day longer than its year." },
        { "topic": "Chemistry", "question": "Helium can turn into a metal under normal atmospheric pressure.", "answer": false, "explanation": "Helium can become metallic only under extremely high pressures, far beyond atmospheric pressure." },
        { "topic": "Mathematics", "question": "There is a number that is exactly one more than its square.", "answer": false, "explanation": "This is mathematically impossible." },
        { "topic": "Sports", "question": "Chess was an Olympic sport.", "answer": false, "explanation": "Chess has never been an official Olympic sport, though there have been calls for its inclusion." },
        { "topic": "Literature", "question": "J.K. Rowling is the first billionaire author.", "answer": true, "explanation": "J.K. Rowling achieved billionaire status from her Harry Potter series." },
        { "topic": "Music", "question": "The Beatles invented the concept album.", "answer": false, "explanation": "The concept album predates The Beatles, with earlier examples existing in the 1940s and 1950s." },
        { "topic": "Geography", "question": "Canada has the longest coastline in the world.", "answer": true, "explanation": "Canada's coastline is the longest in the world, stretching over 202,080 kilometers." },
        { "topic": "Medical", "question": "Drinking alcohol kills brain cells.", "answer": false, "explanation": "While excessive alcohol consumption can damage the brain, it does not kill brain cells." }
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

