import { signIn, SignInResponse, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from 'react-hook-form';



export default function Blank() {
    // const { login } = useUserContext()
    const router = useRouter()
    const { data: session, status } = useSession()


    // const checkValid = () => {
    //     login(email,password).catch(e => {
    //         setError(true)
    //     })
    // }
    useEffect(() => {
        if (!session) {
            router.replace('/home')
        }
        else router.replace('/login')
    },[])



    return (

        <div id="container">

        </div>)
}