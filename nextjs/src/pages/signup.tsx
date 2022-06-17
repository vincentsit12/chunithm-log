import LayoutWrapper from 'components/LayoutWrapper';
import LoadingView from 'components/LoadingView';
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
            <form autoComplete="off" className="inner-540 inner inner-p40 tc bg-white box-shadow relative" onSubmit={handleSubmitForm}>
                {loading &&
                    <div className='bg-black/40	 absolute h-full w-full top-0 left-0 fadeIn'>
                        <LoadingView />
                    </div>
                }
                <h4 className="font-bold">Sign Up</h4>
                <div className="inner inner-p20 ">
                    {lenthError && <div className="bold txt-secondary tl mb10 font14">Please input your username/password at least 6 characters</div>}
                    {error && <div className="bold txt-secondary tl mb10 font14">Please check your username/password is input correctly.</div>}
                    <input  {...register('username', { required: true, minLength: 6, maxLength: 12 })} className="form-control" type="text" placeholder={"Username"}></input>
                    <input  {...register('password', { required: true, minLength: 6 })} className="form-control" type="password" autoComplete='new-password' placeholder={"Password"}></input>
                    <button className="btn btn-secondary mt10" type='submit' onClick={() => { }}>Submit</button>

                </div>


            </form>
        </LayoutWrapper>)
}