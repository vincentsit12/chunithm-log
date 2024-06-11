import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from 'react-hook-form';

import Image from 'next/image';
import LoadingView from 'components/LoadingView';
import LayoutWrapper from 'components/LayoutWrapper';

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
    const { register, handleSubmit, formState: { errors }, } = useForm<FormData>()
    const [loading, setLoading] = useState(false)
    // const checkValid = () => {
    //     login(email,password).catch(e => {
    //         setError(true)
    //     })
    // }

    const handleSubmitForm = handleSubmit(async (values) => {
        const { password, username } = values
        setLoading(true)
        try {
            let result = await signIn('credentials', { redirect: false, username, password })

            if (result?.error) {
                throw result.error
            }
            // const query: Query = router.query
            // console.log("🚀 ~ file: login.tsx ~ line 42 ~ signIn ~ query.callbackUrl", query.callbackUrl)

            router.replace("/home")
        } catch (e) {
            alert(e)
            setLoading(false)
            console.log('login', e)
        }


    })


    const error: boolean = errors?.password?.type === 'required' || errors?.username?.type === 'required'
    return (
        <LayoutWrapper>
            <form onSubmit={handleSubmitForm} >
                <div className="inner-540 inner inner-p40 tc bg-white box-shadow relative" >
                    <h1 className='tc mb20'>Chuni Log</h1>
                    <h4 className="bold">Loginnnnnnnnnnnn</h4>
                    <div className="inner inner-p20 ">
                        {error && <div className="bold txt-secondary tl  font14">Please check your username/password is input correctly.</div>}
                        <input  {...register('username', { required: true })} autoComplete="username" className="form-control" type="text" placeholder={"Username"}></input>
                        <input  {...register('password', { required: true })} autoComplete="password" className="form-control" type="password" placeholder={"Password"}></input>
                        <button type='button' className="btn btn-secondary sm:m-5 m-3   " onClick={(e) => {
                            // e.preventDefault();
                            router.push('/signup')
                        }}>Sign Up</button>
                        <button type="submit" className=" btn btn-secondary sm:m-5 m-3 " onClick={(e) => { }}>Submit</button>
                    </div>
                    {loading &&
                        <div className='bg-black/40	 absolute h-full w-full top-0 left-0 fadeIn'>
                            <LoadingView />
                        </div>
                    }
                </div>

            </form>
        </LayoutWrapper>
    )
}