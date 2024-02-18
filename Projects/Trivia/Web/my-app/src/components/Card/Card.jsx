// Import React and any other necessary libraries
import React from 'react';
import './Card.css';
import Tilt from 'react-parallax-tilt';


// Define the React component
const Card = ({ children }) => {

  return pug`
  Tilt
    .container
      .card
        .front #{children}
        .back`;
}

// Export the component to be used in other parts of the app
export default Card;

