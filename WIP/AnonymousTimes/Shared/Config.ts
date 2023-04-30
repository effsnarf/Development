interface Config {
  fourChan: {
    boards: string[];
  };
  db: {
    fileSystem: {
      dataDir: string;
    };
    mongo: {
      connection: string;
      database: string;
    };
  };
  images: {
    download: boolean;
  };
}

export { Config };
