// Import React and any other necessary libraries
import React from 'react';
import './Card.css';


// Define the React component
function Card(props) {
  return (
    <div class="card"><div class="front"><div class="category"><img src="https://media.cnn.com/api/v1/images/stellar/prod/i-stock-1287493837-1.jpg?c=16x9&amp;q=h_833,w_1480,c_fill"/><div class="title">Video Games</div></div><div class="question">The first iPhone was released in 2005</div><div class="index">1 of 10</div><div class="buttons"><button class="false">❌ false</button><button class="true">✔️ true</button></div></div><div class="back">Fuck this shit</div></div>
  );
}

// Export the component to be used in other parts of the app
export default Card;

