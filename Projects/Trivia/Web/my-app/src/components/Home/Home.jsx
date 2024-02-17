// Import React and any other necessary libraries
import React, { useState } from 'react';
import Intro from '../Intro/Intro';
import Test from '../Test/Test';
import './Home.css';


const Home = ({  }) => {

    const onClickBegin = () => {
        alert(`You clicked the button!`);
    }

    return pug`
    .cards
        Intro(onClickBegin=onClickBegin)
        Test
    `
}

export default Home;
