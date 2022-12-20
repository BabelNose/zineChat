export interface IToken {
    accessToken: String,
    accessTokenExpiresOn: Date,
    client : Object,
    clientId: String,
    refreshToken: String,
    refreshTokenExpiresOn: Date,
    user: Object,
    userId: String
  }