"use client";

import { create } from "zustand";
import { logout as logoutRequest, signIn, signUp } from "../lib/auth-api";
import { clearAuthToken, readAuthToken, writeAuthToken } from "../lib/session";
import type { AuthUser, SignInInput, SignUpInput } from "../types/auth";

type AuthMode = "signin" | "signup";
type AuthResponse = {
  message: string;
  success: boolean;
  token?: string;
  user?: AuthUser;
};

type AuthState = {
  mode: AuthMode;
  isLoading: boolean;
  message: string;
  error: string;
  token: string;
  user: AuthUser | null;
  setAuthSession: (payload: { token?: string; user?: AuthUser | null }) => void;
  setMode: (mode: AuthMode) => void;
  clearFeedback: () => void;
  submitSignIn: (payload: SignInInput) => Promise<AuthResponse>;
  submitSignUp: (payload: SignUpInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  mode: "signup",
  isLoading: false,
  message: "",
  error: "",
  token: readAuthToken(),
  user: null,
  setAuthSession: ({ token, user }) =>
    set((state) => ({
      token: token ?? state.token,
      user: user ?? state.user,
    })),
  setMode: (mode) => set({ mode, message: "", error: "" }),
  clearFeedback: () => set({ message: "", error: "" }),
  submitSignIn: async (payload) => {
    set({ isLoading: true, error: "", message: "" });
    try {
      const response = await signIn(payload);
      if (response.token) {
        writeAuthToken(response.token);
      }
      set({
        isLoading: false,
        token: response.token ?? "",
        user: response.user ?? null,
        message: response.message || "Authorized successfully",
      });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error.message : "Sign in failed";
      set({ isLoading: false, error: err });
      return { message: err, success: false };
    }
  },
  submitSignUp: async (payload) => {
    set({ isLoading: true, error: "", message: "" });
    try {
      const response = await signUp(payload);
      if (response.token) {
        writeAuthToken(response.token);
      }
      set({
        isLoading: false,
        token: response.token ?? "",
        user: response.user ?? null,
        message: response.message || "Node initialized successfully",
      });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error.message : "Sign up failed";
      set({ isLoading: false, error: err });
      return { message: err, success: false };
    }
  },
  logout: async () => {
    const token = readAuthToken();
    if (token) {
      await logoutRequest(token);
    } else {
      clearAuthToken();
    }

    set({ token: "", user: null, message: "", error: "", mode: "signup" });
  },
}));
