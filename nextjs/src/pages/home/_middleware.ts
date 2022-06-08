import { NextApiRequest } from "next"
import { getToken } from "next-auth/jwt"
import { getSession } from "next-auth/react"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
    const session = await getToken({
        req,
        secret: process.env.JWT_SECRET,
    })
    // console.log('_middleware', session)
    const { pathname } = req.nextUrl

    if (session) {
        return NextResponse.next()
    }

    if (!session && pathname !== "/login") {
        const url = req.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }
}