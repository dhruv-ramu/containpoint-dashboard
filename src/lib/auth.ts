import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import type { UserRole } from "@/generated/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export async function getSessionUser() {
  const session = await auth();
  return session?.user as SessionUser | undefined;
}

export async function getOrgMembership(userId: string) {
  return prisma.organizationMembership.findFirst({
    where: { userId },
    include: { organization: true },
  });
}

export async function getFacilityMemberships(userId: string) {
  return prisma.facilityMembership.findMany({
    where: { userId },
    include: { facility: true },
  });
}

export async function getUserRoleInFacility(userId: string, facilityId: string): Promise<UserRole | null> {
  const membership = await prisma.facilityMembership.findUnique({
    where: {
      facilityId_userId: { facilityId, userId },
    },
  });
  return membership?.role ?? null;
}

export async function getUserRoleInOrg(userId: string, organizationId: string): Promise<UserRole | null> {
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
  });
  return membership?.role ?? null;
}
