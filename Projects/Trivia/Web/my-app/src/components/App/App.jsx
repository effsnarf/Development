// Import React and any other necessary libraries
import React, { useEffect } from 'react';
import { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import RouteManager from '../misc/RouteManager';
import './App.css';
import Intro from '../Intro/Intro';
import Question from '../Question/Question';



const App = ({  }) => {

  const routes = [
    { path: "/", component: Intro },
    { path: "/question/:index", component: Question },
  ];

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    
  }, []);

  return pug`
  .app
    .cards
      RouteManager(routes=routes)
  `;
}


export default App;

