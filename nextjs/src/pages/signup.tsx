import LayoutWrapper from 'components/LayoutWrapper';
import LoadingView from 'components/LoadingView';
import { signIn, SignInResponse } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from 'react-hook-form';
import { signUp } from 'utils/api';
import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';


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
    const [loading, setLoading] = useState(false)

    // const checkValid = () => {
    //     login(email,password).catch(e => {
    //         setError(true)
    //     })
    // }
    const handleSubmitForm = handleSubmit(async (values) => {
        const { password, username } = values

        setLoading(true)
        signUp(username, password).then((result: any) => {
            if (result) {
                signIn('credentials', { redirect: false, username, password }).then((result: any) => {

                    if (result?.error) {
                        throw result.error
                    }
                    const query: Query = router.query
                    router.push(query.callbackUrl || "/home")


                })
            }
        }).catch(e => {
            alert(e)
            setLoading(false)
            console.log('signup', e)
        })

    })


    const error: boolean = errors?.password?.type === 'required' || errors?.username?.type === 'required'
    const lenthError: boolean = errors?.username?.type === 'minLength' || errors?.username?.type === 'maxLengh' || errors?.password?.type === 'minLength'
    return (
        <LayoutWrapper>
            <form autoComplete="off" className="mx-auto max-w-xl" onSubmit={handleSubmitForm}>
                <Surface className='relative overflow-hidden px-6 py-8 text-center sm:px-10'>
                {loading &&
                    <div className='absolute inset-0 bg-slate-950/35 backdrop-blur-sm'>
                        <LoadingView />
                    </div>
                }
                <p className='mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300'>New Account</p>
                <h1 className="text-3xl font-bold text-white">Create your Chuni-Log profile</h1>
                <div className="mt-8 space-y-4 text-left">
                    {lenthError && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">Please use 6 to 12 characters for your username and password.</div>}
                    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">Please complete both fields before submitting.</div>}
                    <TextField {...register('username', { required: true, minLength: 6, maxLength: 12 })} type="text" placeholder={"Username"} />
                    <TextField {...register('password', { required: true, minLength: 6 })} type="password" autoComplete='new-password' placeholder={"Password"} />
                    <div className='pt-2 text-center'>
                        <Button type='submit'>Create Account</Button>
                    </div>

                </div>
                </Surface>


            </form>
        </LayoutWrapper>)
}