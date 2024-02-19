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
    const url = `https://db.memegenerator.net/trivia/questions?_u=${Date.now()}`;

    const questions = (await (await fetch(url)).json());

    return questions;
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
  const getTopicImageUrl = (topic) => `https://db.memegenerator.net/random/image/${topic.toLowerCase()}`


  const setAnswer = (index, answer) => {
    setAnswers((answers) => {
      answers[index] = answer;
      return [...answers];
    });
  }

  return (
    <GlobalContext.Provider value={{ getNewQuestions, questions, answers, setAnswer, transitionDuration, getTopicImageUrl }}>
      {children}
    </GlobalContext.Provider>
  );
};

