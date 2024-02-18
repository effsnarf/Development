import { useParams } from "react-router-dom";
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import './Results.css';
import { useGlobal } from '../misc/global';


const Results = ({  }) => {

const { questions, answers } = useGlobal();

const isFactTrue = (index) => {
    return questions[index].answer;
}

const isCorrect = (index) => {
    return answers[index] === questions[index].answer;
}

const score = answers
    .filter((answer, index) => isCorrect(index))
    .length;

  return pug`
  Card
    .title You scored #{score}/10 👽
    .results
        each question, index in questions
            .result(key=index)
                .flex1
                    .success #{isCorrect(index) ? '➕' : '➖'}
                    .question2 #{question.question}
                    .answer #{isFactTrue(index) ? '✔️' : '❌'}
                .explanation #{question.explanation}
    .buttons
        Link(to="/")
          button.false Play again❔
  `
}

export default Results;

