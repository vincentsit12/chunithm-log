import axios, { AxiosError } from 'axios'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import Users from '@/db/model/users'
import { CustomAPIError } from '@/errors/CustomAPIError'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { data } = await axios.post(`${process.env.NEXTAUTH_URL}/api/user/login`, credentials)

          if (data) {
            return data
          }

          return null
        } catch (error) {
          const err = error as AxiosError
          const errObj = err.response?.data as CustomAPIError | undefined
          return Promise.reject(new Error(errObj?.message ?? 'Unable to sign in'))
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user
      }

      return token
    },
    async session({ session, token }) {
      session.user = token.user as Users
      return session
    },
  },
  events: {},
  debug: false,
}