"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "../landing/Footer";
import { AppSidebar } from "../layout/AppSidebar";
import { useAuthStore } from "../../store/auth-store";
import { fetchCurrentUser, updateUserProfile } from "../../lib/user-api";
import { writeAuthToken } from "../../lib/session";

export function SettingsPortal() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const setAuthSession = useAuthStore((state) => state.setAuthSession);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/sign");
    }
  }, [router, token]);

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const user = await fetchCurrentUser(token);
        setUsername(user.username);
        setEmail(user.email);
      } catch (loadError) {
        const loadMessage = loadError instanceof Error ? loadError.message : "Failed to load profile";
        setError(loadMessage);
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, [token]);

  async function handleLogout() {
    await logout();
    router.replace("/sign");
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const response = await updateUserProfile(token, {
        username,
        email,
        ...(password ? { password } : {}),
      });

      if (response.token) {
        writeAuthToken(response.token);
      }

      setAuthSession({ token: response.token, user: response.user ?? null });
      setPassword("");
      setMessage("Profile updated successfully");
    } catch (saveError) {
      const saveMessage = saveError instanceof Error ? saveError.message : "Failed to update profile";
      setError(saveMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface-dim text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-425">
        <AppSidebar
          active="settings"
          onAddMonitor={() => router.push("/dashboard")}
          onLogout={handleLogout}
          onNavigate={(href) => router.push(href)}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <div className="px-6 pt-10 sm:px-8">
            <h1 className="font-display text-4xl font-black tracking-tight text-on-surface">User Profile Settings</h1>
            <p className="mt-2 text-sm text-on-surface-variant">Update your profile details and account credentials.</p>
          </div>

          <div className="px-6 pb-8 pt-6 sm:px-8">
            {error ? <div className="mb-4 rounded-lg bg-error/15 px-4 py-2 text-sm text-error">{error}</div> : null}
            {message ? <div className="mb-4 rounded-lg bg-primary/12 px-4 py-2 text-sm text-primary">{message}</div> : null}

            {isLoading ? (
              <div className="space-y-4 rounded-xl bg-surface-low p-6">
                <div className="h-4 w-32 animate-pulse rounded bg-surface-high" />
                <div className="h-12 w-full animate-pulse rounded bg-surface-high" />
                <div className="h-4 w-32 animate-pulse rounded bg-surface-high" />
                <div className="h-12 w-full animate-pulse rounded bg-surface-high" />
                <div className="h-4 w-32 animate-pulse rounded bg-surface-high" />
                <div className="h-12 w-full animate-pulse rounded bg-surface-high" />
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 rounded-xl bg-surface-low p-6">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Username</label>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-12 w-full rounded-md bg-surface-high px-4 text-sm text-on-surface"
                    placeholder="Username"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Email</label>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-md bg-surface-high px-4 text-sm text-on-surface"
                    placeholder="Email"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">New Password</label>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-md bg-surface-high px-4 text-sm text-on-surface"
                    placeholder="Leave empty to keep current password"
                    type="password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-[#071018] transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}
          </div>

          <div className="px-6 pb-6 sm:px-8">
            <Footer className="mt-4" />
          </div>
        </div>
      </div>
    </main>
  );
}
