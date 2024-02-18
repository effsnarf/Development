// Import React and any other necessary libraries
import React, { useEffect } from 'react';
import { useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import RouteManager from '../misc/RouteManager';
import './App.css';
import Intro from '../Intro/Intro';
import Test from '../Test/Test';



const App = ({  }) => {

  const routes = [
    { path: "/", component: Intro },
    { path: "/test", component: Test },
    // Add more routes as needed
  ];

  return pug`
  .app
    .cards
      RouteManager(routes=routes)
  `;
}


export default App;

