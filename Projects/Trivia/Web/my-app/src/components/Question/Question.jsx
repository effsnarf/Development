import { useParams } from "react-router-dom";
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import { useLocation } from 'react-router-dom';
import './Question.css';


// Define the React component
const Question = ({  }) => {
  // useParams is not available because we're not inside a Route component
  // We're using custom route management for animations
  const location = useLocation();
  const questionIndex = parseInt(useLocation().pathname.split('/')[2]);

  return pug`
  Card
    .category
        img(src="https://media.cnn.com/api/v1/images/stellar/prod/i-stock-1287493837-1.jpg?c=16x9&q=h_833,w_1480,c_fill")
        .title Video Games
    .question The first iPhone was released in 2005
    .index #{questionIndex+1} of 10
    .buttons
        button.false ❌ false
        Link(to="/question/1")
          button.true ✔️ true
  `
}

// Export the component to be used in other parts of the app
export default Question;

