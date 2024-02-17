// Import React and any other necessary libraries
import React, { useEffect } from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import './App.css';
import Intro from '../Intro/Intro';
import Test from '../Test/Test';



const App = ({  }) => {

  const location = useLocation();

  return pug`
  .app
    .cards
      Switch
        Route(path="/test", component=Test)
        Route(path="/", component=Intro)
  `;
}


export default App;

