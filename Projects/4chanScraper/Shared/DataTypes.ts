class Timestamp {
  dt: number;

  constructor(dt: number) {
    this.dt = parseInt(dt.toString());
  }

  static now() {
    return new Timestamp(Date.now());
  }
}

interface Image {
  filename: string;
}

interface Forum {
  id: string;
}

interface Post {
  id: number;
  title: string;
  comment: string;
  image: Image;
  created: Timestamp;
  isSticky: boolean;
  replies: {
    from: number[];
    to: number[];
  };
  relevance: number;
  length: number;
}

interface Thread {
  _id: any;
  id: number;
  forum: Forum;
  posts: {
    count: number;
    items: Post[];
  };
  analysis: {
    entity: string;
    subject: string;
    title: string;
    summary: string;
    article: string;
  };
  scores: any;
  keywords: string[];
  quotes: string[];
  created: Timestamp;
  modified: Timestamp;
  checked: Timestamp;
  isOnline: boolean;
  isSticky: boolean;
}

interface ThreadTeaser {
  _id: any;
  id: number;
  forum: Forum;
  entity: string;
  title: string;
  subtitle: string;
  summary: string;
  quotes: string[];
  image: Image;
  posts: {
    count: number;
  };
  created: Timestamp;
  modified: Timestamp;
}

export { Forum, Thread, ThreadTeaser, Post, Timestamp, Image };
