interface NewsArticle {
  _id: number;
  url: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  images: {
    teaser: string;
    items: string[];
  };
  date: number;
}

export { NewsArticle };
