import { getCurrentUser } from "./auth";

/**
 * Admin email addresses (comma-separated in env, or default list)
 */
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ||
  "jakeshapiro007@gmail.com,jboner2111@gmail.com"
).split(",").map((email) => email.trim().toLowerCase());

/**
 * Check if the current user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch (error) {
    console.error("[isAdmin] Error:", error);
    return false;
  }
}

