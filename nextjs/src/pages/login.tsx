import e from 'cors';
import { signIn, SignInResponse, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from 'react-hook-form';


type FormData = {
    username: string;
    password: string;
};

type Query = {
    callbackUrl?: string,
}
export default function Login() {
    // const { login } = useUserContext()
    const router = useRouter()
    const { data: session, status } = useSession()
    const { register, handleSubmit, formState: { errors }, } = useForm<FormData>()

    // const checkValid = () => {
    //     login(email,password).catch(e => {
    //         setError(true)
    //     })
    // }

    const handleSubmitForm = handleSubmit(async (values) => {
        const { password, username } = values


        signIn('credentials', { redirect: false, username, password }).then((result: any) => {


            if (result?.error) {
                throw result.error
            }

            const query: Query = router.query

            router.replace(query.callbackUrl || "/home")


        }).catch(e => {
            alert(e)
            console.log('login', e)
        })

        // router.push("/")
    })


    const error: boolean = errors?.password?.type === 'required' || errors?.username?.type === 'required'
    return (

        <div id="container">
            <form onSubmit={handleSubmitForm} >
                <div className="inner-540 inner inner-p40 tc bg-white box-shadow" >
                    <h1 className='tc mb20'>Chunithm Log</h1>

                    <h4 className="bold">Login</h4>
                    <div className="inner inner-p20 ">
                        {error && <div className="bold txt-secondary tl  font14">Please check your username/password is input correctly.</div>}
                        <input  {...register('username', { required: true })} autoComplete="username" className="form-control" type="text" placeholder={"Username"}></input>
                        <input  {...register('password', { required: true })} autoComplete="password" className="form-control" type="password" placeholder={"Password"}></input>
                        <button type='button' className="btn btn-secondary m20" onClick={(e) => {
                            // e.preventDefault();
                            router.push('/signup')
                        }}>Sign Up</button>
                        <button type="submit" className=" btn btn-secondary m20 " onClick={(e) => { }}>Submit</button>
                    </div>


                </div>
            </form>
        </div >
    )
}