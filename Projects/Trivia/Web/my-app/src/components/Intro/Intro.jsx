// Import React and any other necessary libraries
import { useGlobal } from '../misc/global';
import { useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import './Intro.css';


const Intro = ({  }) => {

  const location = useLocation();

  const { transitionDuration, getNewQuestions } = useGlobal();

  // Whenever the home page is loaded, fetch new questions
  useEffect(() => {
    if (location.pathname === '/') setTimeout(getNewQuestions, transitionDuration);
  }, [location]);

  return pug`
  Card
    .title Welcome to the Trivia Challenge!
    div You will be presented with 10 True or False questions
    div Can you score 100% ?
    .buttons
      Link(to="/question/0")
        button Begin 👉
  `
}

export default Intro;
