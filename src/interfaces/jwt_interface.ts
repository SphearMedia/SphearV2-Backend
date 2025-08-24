export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'listener' | 'artist';
}