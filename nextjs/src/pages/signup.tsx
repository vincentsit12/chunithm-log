import { signIn, SignInResponse } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from 'react-hook-form';
import { signUp } from 'utils/api';


type FormData = {
    username: string;
    password: string;
};

type Query = {
    callbackUrl?: string,
}
export default function SignUp() {
    // const { login } = useUserContext()
    const router = useRouter()
    const { register, handleSubmit, formState: { errors }, } = useForm<FormData>()

    // const checkValid = () => {
    //     login(email,password).catch(e => {
    //         setError(true)
    //     })
    // }
    const handleSubmitForm = handleSubmit(async (values) => {
        const { password, username } = values


        signUp(username, password).then((result: any) => {
            console.log("🚀 ~ file: signup.tsx ~ line 32 ~ signUp ~ result", result)
            if (result) {
                signIn('credentials', { redirect: false, username, password }).then((result: any) => {
                    console.log("🚀 ~ file: login.tsx ~ line 27 ~ handleSubmitForm ~ result", result)

                    if (result?.error) {
                        throw result.error
                    }

                    const query: Query = router.query

                    console.log("🚀 ~ file: index.tsx ~ line 40 ~ signIn ~ query.callbackUrl", query.callbackUrl)
                    router.push(query.callbackUrl || "/home")


                })
            }
        }).catch(e => {
            alert(e)
            console.log('signup', e)
        })

        // router.push("/")
    })


    const error: boolean = errors?.password?.type === 'required' || errors?.username?.type === 'required'
    return (
        <div id="container">
            <form autoComplete="off" className="inner-540 inner inner-p40 tc bg-white box-shadow" onSubmit={handleSubmitForm}>

                <h4 className="bold">Sign Up</h4>
                <div className="inner inner-p20 ">
                    {error && <div className="bold txt-secondary tl mb10 font14">Please check your username/password is input correctly.</div>}
                    <input  {...register('username', { required: true })} className="form-control" type="text"  placeholder={"Username"}></input>
                    <input  {...register('password', { required: true })} className="form-control" type="password" autoComplete='new-password' placeholder={"Password"}></input>
                    <button className="btn btn-secondary mt10" onClick={() => { }}>Submit</button>
                </div>


            </form>
        </div>)
}