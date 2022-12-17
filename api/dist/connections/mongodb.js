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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongodb = void 0;
const mongodb_1 = __importDefault(require("mongodb"));
const config_1 = __importDefault(require("../config/config"));
const mongodb = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = new mongodb_1.default.MongoClient(config_1.default.MONGODB_HOST + config_1.default.MONGODB_PORT);
    yield client.connect();
    const db = client.db(config_1.default.MONGODB_DB_NAME);
    return db;
});
exports.mongodb = mongodb;
