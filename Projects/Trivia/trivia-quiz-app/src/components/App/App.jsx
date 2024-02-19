// Import React and any other necessary libraries
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useState, useContext } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import RouteManager from '../misc/RouteManager';
import './App.css';
import { GlobalProvider } from '../misc/global';
import PreloadImages from '../misc/PreloadImages';
import Intro from '../Intro/Intro';
import Question from '../Question/Question';
import Results from '../Results/Results';

const App = ({  }) => {

  const routes = [
    { path: "/", component: Intro },
    { path: "/question/:index", component: Question },
    { path: "/results", component: Results }
  ];

  return pug`
  .app
    GlobalProvider
      .cards
        RouteManager(routes=routes)
      PreloadImages
  `;
}


export default App;

