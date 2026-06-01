/**
 * Player profile — the identity a user creates during onboarding.
 *
 * Demo build: persisted in localStorage (see ./store). TODO(drafted): swap the
 * store for Supabase Auth + a `profiles` row once the backend is wired up. The
 * shape here maps 1:1 to the planned `profiles` table so the swap is mechanical.
 */

export type AvatarStyle = "jersey" | "classic" | "crest";

export interface AvatarConfig {
  style: AvatarStyle;
  /** Hex colour for the jersey/background. */
  color: string;
  /** Supported-team id for a crest-style avatar. */
  teamId?: string | null;
  /** Jersey number 1–99 for jersey-style avatars. */
  number?: number | null;
}

export type AuthProvider = "email" | "google";

export interface PlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string | null;
  authProvider: AuthProvider;
  avatar: AvatarConfig;
  /** Teams the user supports — themes nickname/avatar suggestions. */
  supportedTeamIds: string[];
  createdAt: string;
}
