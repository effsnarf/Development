// Import React and any other necessary libraries
import React from 'react';
import Card from '../Card/Card';
import './Test.css';


// Define the React component
const Test = ({  }) => {
  return pug`
  Card
    .category
        img(src="https://media.cnn.com/api/v1/images/stellar/prod/i-stock-1287493837-1.jpg?c=16x9&q=h_833,w_1480,c_fill")
        .title Video Games
    .question The first iPhone was released in 2005
    .index 1 of 10
    .buttons
        button.false ❌ false
        button.true ✔️ true
  `
}

// Export the component to be used in other parts of the app
export default Test;

