import { signIn, SignInResponse, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { SplashScreen } from '@/components/ui/SplashScreen';


export default function Blank() {
    const router = useRouter()
    const { data: session, status } = useSession()

    useEffect(() => {

        if (status === "authenticated") {
            router.replace('/home')
        }
        else if (status === "unauthenticated")
            router.replace('/login')

    }, [status, router])



    return (
        <SplashScreen />
    

    )
}