// Import React and any other necessary libraries
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import './Intro.css';


const Intro = ({  }) => {

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
