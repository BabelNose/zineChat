"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongodb = void 0;
function mongodb() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new mongoDB.MongoClient("localhost:1337");
        yield client.connect();
        const db = client.db(process.env.DB_NAME);
        const gamesCollection = db.collection(process.env.GAMES_COLLECTION_NAME);
        collections.games = gamesCollection;
        console.log(`Successfully connected to database: ${db.databaseName} and collection: ${gamesCollection.collectionName}`);
    });
}
exports.mongodb = mongodb;
