// Import React and any other necessary libraries
import React from 'react';
import Tilt from 'react-parallax-tilt';
import './Card.css';


// Define the React component
const Card = ({ children, flipped }) => {
  const containerClasses = `${flipped ? 'flipped' : ''}`;

  return pug`
  .container(className=containerClasses)
    Tilt
      .card
        .front #{children}
        .back Fuck this shit`;
}

// Export the component to be used in other parts of the app
export default Card;

