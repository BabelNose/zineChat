import { tokensRepo } from "../repositories/oauth/tokensRepo";
import { clientsRepo } from "../repositories/likesRepo";
import { usersRepo } from "../repositories/usersRepo";
import { Token, Client, User } from "oauth2-server";

const OAuthTokensModel = tokensRepo;
const OAuthClientsModel = clientsRepo;
const OAuthUsersModel = usersRepo;

/**
 * Get access token.
 */

export const getAccessToken = function(bearerToken:string) {
  // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and oauth2-server complains.
  return OAuthTokensModel.findOne({ accessToken: bearerToken }).lean();
};

/**
 * Get client.
 */

export const getClient = function(clientId:string, clientSecret:string) {
  return OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret }).lean();
};

/**
 * Get refresh token.
 */

export const getRefreshToken = function(refreshToken:string) {
  return OAuthTokensModel.findOne({ refreshToken: refreshToken }).lean();
};

/**
 * Get user.
 */

export const getUser = function(username:string, password:string) {
  return OAuthUsersModel.findOne({ username: username, password: password }).lean();
};

/**
 * Save token.
 */

export const saveToken = function(token:Token, client:Client, user:User) {
    var accessToken = new OAuthTokensModel({
        accessToken: token.accessToken,
        accessTokenExpiresOn: token.accessTokenExpiresOn,
        client : client,
        clientId: client.clientId,
        refreshToken: token.refreshToken,
        refreshTokenExpiresOn: token.refreshTokenExpiresOn,
        user : user,
        userId: user._id,
    });
    // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
    return new Promise<any>(function(resolve,reject){
        accessToken.save(function(err,data){
            if( err ) reject( err );
            else resolve( data );
        }) ;
    }).then(function(saveResult){
        // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
        saveResult = saveResult && typeof saveResult == 'object' ? JSON.stringify(saveResult) : saveResult;

        // Unsure what else points to `saveResult` in oauth2-server, making copy to be safe
        var data:any = {client:'', user:''};
        for( var prop in saveResult ) data[prop] = saveResult[prop];

        // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
        data.client = data.clientId;
        data.user = data.userId;

        return data;
    });
};