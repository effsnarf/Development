import { useParams } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import { useLocation } from 'react-router-dom';
import './Question.css';
import { useGlobal } from '../misc/global';

let oldQuestionIndex = null;

const Question = ({ freeze }) => {
  // useParams is not available because we're not inside a Route component
  // We're using custom route management for animations
  const location = useLocation();

  const getQuestionIndex = () => (parseInt(location.pathname.split('/')[2]) || 0);

  const getActiveQuestionIndex = () => freeze ? oldQuestionIndex : questionIndex;

  // State to manage the current question index
  const [questionIndex, setQuestionIndex] = useState(getQuestionIndex());

  const { questions, setAnswer, getTopicImageUrl } = useGlobal();

  useEffect(() => {
    oldQuestionIndex = questionIndex;
    setQuestionIndex(getQuestionIndex());
  }, [location, freeze]);

  const onClickAnswer = (answer) => {
    setAnswer(questionIndex, answer);
  }

  const activeQuestionIndex = getActiveQuestionIndex();

  let question = questions[activeQuestionIndex];

  if (!question) return pug`div`;

  const topicImageUrl = getTopicImageUrl(question.topic);
  const nextLink = (questionIndex >= (questions.length - 1)) ? `/results` : `/question/${questionIndex + 1}`;

  return pug`
  Card
    .category
        img(src=topicImageUrl)
        .title #{question.topic}
    .question #{question.question}
    .index #{activeQuestionIndex+1} of #{questions.length}
    .buttons
        Link(to=nextLink)
          button.false(onClick=() => onClickAnswer(false)) ❌ false
        Link(to=nextLink)
          button.true(onClick=() => onClickAnswer(true)) ✔️ true
  `
}

export default Question;

