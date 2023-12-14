interface Config {
  fourChan: {
    boards: string[];
  };
  db: {
    fileSystem: {
      dataDir: string;
    };
    mongo: {
      connectionString: string;
      database: string;
    };
  };
  images: {
    download: boolean;
    take: {
      per: {
        thread: number;
      };
    };
  };
}

export { Config };
