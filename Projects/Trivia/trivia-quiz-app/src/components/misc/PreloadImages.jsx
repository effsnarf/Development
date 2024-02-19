import './util';
import React from 'react';
import { useGlobal } from '../misc/global';


const PreloadImages = ({  }) => {

    const { questions, getTopicImageUrl } = useGlobal();

    const topics = questions
        .map(q => q.topic.toLowerCase())
        .distinct();

    const imageUrls = topics.map(getTopicImageUrl);

    return pug`
    div(style={display: 'none'})
        each imageUrl, index in imageUrls
            img(src=imageUrl, key=index)
  `;
}


export default PreloadImages;

