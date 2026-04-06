export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthResponse = {
  message: string;
  success: boolean;
  token?: string;
  user?: AuthUser;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
