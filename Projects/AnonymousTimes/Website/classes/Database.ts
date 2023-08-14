import { MongoDatabase } from '../../../Shared/MongoDatabase'

class Database {
  private static instance: Database
  private mongo!: MongoDatabase

  private constructor() {}

  static async getThread() {
    const dbThreads = await Database.getCollection('Threads')
    return await dbThreads.find({ id: 419244492 }).toArray()
  }

  private static async getCollection(collectionName: string) {
    const db = await Database.getInstance()
    return db.mongo.getCollection(collectionName)
  }

  private static async getInstance() {
    if (!Database.instance) {
      Database.instance = new Database()
      Database.instance.mongo = await MongoDatabase.new(
        `mongodb://localhost:27017`,
        `AnonymousTimes`
      )
    }

    return Database.instance
  }
}

export { Database }
