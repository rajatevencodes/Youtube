export interface AuthConfig {
  jwt: JWTConfig;
  cookie: CookieConfig;
}

export interface JWTConfig {
  secretKey: string;
  expiresIn: string;
}

export interface CookieConfig {
  name: string;
  expiresInHours: number;
  httpOnly: boolean;
  secure: boolean;
}
