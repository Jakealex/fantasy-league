import { prisma } from "./prisma";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "fantasy-session";
const SESSION_DURATION_DAYS = 7;

/**
 * Get the current authenticated user from the session cookie
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    // Parse session token: userId:timestamp:signature
    const parts = sessionToken.split(":");
    if (parts.length !== 3) {
      return null;
    }

    const [userId, timestamp] = parts;
    const sessionAge = Date.now() - parseInt(timestamp, 10);

    // Check if session expired (7 days)
    if (sessionAge > SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000) {
      return null;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { ok: false, error: "Invalid email or password" };
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return { ok: false, error: "Invalid email or password" };
    }

    // Create session token: userId:timestamp:signature
    const timestamp = Date.now().toString();
    const signature = await hash(`${user.id}:${timestamp}`, 4); // Quick hash for signature
    const sessionToken = `${user.id}:${timestamp}:${signature}`;

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    return { ok: true };
  } catch (error) {
    console.error("[signIn] Error:", error);
    return { ok: false, error: "Failed to sign in" };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

