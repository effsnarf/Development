// Import React and any other necessary libraries
import React from 'react';
import Tilt from 'react-parallax-tilt';
import './Card.css';


// Define the React component
const Card = ({ children }) => {

  return pug`
  .container
    Tilt
      .card
        .front #{children}
        .back`;
}

// Export the component to be used in other parts of the app
export default Card;

