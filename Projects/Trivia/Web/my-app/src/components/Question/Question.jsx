import { useParams } from "react-router-dom";
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import { useLocation } from 'react-router-dom';
import './Question.css';
import { useGlobal } from '../misc/global';


const Question = ({  }) => {
  // useParams is not available because we're not inside a Route component
  // We're using custom route management for animations
  const location = useLocation();
  const questionIndex = parseInt(useLocation().pathname.split('/')[2]);

  const { questions, setAnswer } = useGlobal();

  const onClickAnswer = (answer) => {
    setAnswer(questionIndex, answer);
  }

  let question = questions[questionIndex];

  if (!question) return pug`div`;

  const nextLink = (questionIndex >= (questions.length - 1)) ? `/results` : `/question/${questionIndex + 1}`;

  return pug`
  Card
    .category
        img(src="https://media.cnn.com/api/v1/images/stellar/prod/i-stock-1287493837-1.jpg?c=16x9&q=h_833,w_1480,c_fill")
        .title #{question.topic}
    .question #{question.question}
    .index #{questionIndex+1} of #{questions.length}
    .buttons
        Link(to=nextLink)
          button.false(onClick=() => onClickAnswer(false)) ❌ false
        Link(to=nextLink)
          button.true(onClick=() => onClickAnswer(true)) ✔️ true
  `
}

export default Question;
