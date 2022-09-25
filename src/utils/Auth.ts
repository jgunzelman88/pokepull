import * as jwt from "jsonwebtoken";

const LOGIN_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SERVICE_SCOPE = "openid email https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";

let access_token = ""

export function get_access_token(): Promise<string>{
    return new Promise<string>(
        (resolve, reject) => {
            if(access_token !== "") resolve(access_token)
            let key = process.env.GOOGLE_AUTH_CERT;
            let email = process.env.GOOGLE_ACCOUNT;
            if(key === "") reject("GOOGLE_AUTH_CERT not set")
            if(email === "") reject("GOOGLE_ACCOUNT not set")

            let iat = Date.now() / 1000
            let exp = iat + 60
            let claims =
            {
                iss: email,
                scope: SERVICE_SCOPE,
                aud: TOKEN_URI,
                iat: iat,
                exp: exp
            }
            let token = jwt.sign(claims, key, {algorithm: "RS256"})
            let form = `grant_type=${encodeURIComponent(GRANT_TYPE)}&assertion=${encodeURIComponent(token)}`
            
            fetch(LOGIN_URL,
                {
                    method: "POST",
                    body: form,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                })
                .then(res => {res.json()})
                .then((data: any) => {
                    this.access_token = data.access_token
                    resolve(this.access_token)
                })
                .catch(e => {console.log(e);reject(e)})
        }
    );
}