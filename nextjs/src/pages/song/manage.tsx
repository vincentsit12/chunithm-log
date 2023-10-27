import { getSession, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from 'react-hook-form';

import Image from 'next/image';
import LoadingView from 'components/LoadingView';
import LayoutWrapper from 'components/LayoutWrapper';
import { NextPage } from 'next';
import axios from 'axios';

type FormData = {
    name: string;
    masterRate?: number;
    masterCombo?: number;
    ultimaRate?: number;
    ultimaCombo?: number;
    expertRate?: number;
    expertCombo?: number;
};


const AdminPage = () => {
    
    const session = useSession()
    const router = useRouter()
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>()
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (!session.data?.user.isAdmin) {
            router.replace("/home")
        }
    }, [session])
    
    // const checkValid = () => {
    //     login(email,password).catch(e => {
    //         setError(true)
    //     })
    // }

    const handleSubmitForm = handleSubmit(async (values) => {
        const { name } = values
        // setLoading(true)
        let body = {
            name: name,
            master: (values.masterCombo && values.masterRate) ? {
                rate: values.masterRate,
                combo: values.masterCombo
            } : null,
            ultima: (values.ultimaCombo && values.ultimaRate) ? {
                rate: values.ultimaRate,
                combo: values.ultimaCombo
            } : null,
            expert: (values.expertCombo && values.expertRate) ? {
                rate: values.expertRate,
                combo: values.expertCombo
            } : null
        }
        if (confirm(`Are you sure to add ${body.name}?`)) {
            let result = await axios.post("/api/songs/add", body)
            console.log(result)
            reset()
        }
    })


    const error: boolean = errors?.name?.type === 'required'
    return (
        <LayoutWrapper>
           {session.data?.user.isAdmin && <form onSubmit={handleSubmitForm} >
                <div className="inner-540 inner inner-p40 bg-white box-shadow relative" >
                    <h4 className="bold text-left">Add Song</h4>
                    <div className="inner  ">
                        {error && <div className="bold txt-secondary tl  font14">Please check your username/password is input correctly.</div>}
                        <input  {...register('name', { required: true })} className="form-control" type="text" placeholder={"Song Name"}></input>
                        <h4 className="bold text-left">Master</h4>
                        <input  {...register('masterRate', { valueAsNumber : true })} className="form-control" placeholder={"Rate"}></input>
                        <input  {...register('masterCombo', { valueAsNumber: true })} className="form-control" type="number" placeholder={"Combo"}></input>
                        <h4 className="bold text-left">Ultima</h4>
                        <input  {...register('ultimaRate', { valueAsNumber: true })} className="form-control" type="number" placeholder={"Rate"}></input>
                        <input  {...register('ultimaCombo', { valueAsNumber: true })} className="form-control" type="number" placeholder={"Combo"}></input>
                        <h4 className="bold text-left">Expert</h4>
                        <input  {...register('expertRate', { valueAsNumber: true })} className="form-control" type="number" placeholder={"Rate"}></input>
                        <input  {...register('expertCombo', { valueAsNumber: true })} className="form-control" type="number" placeholder={"Combo"}></input>
                        <div className='tc'>
                            <button type='button' className="btn btn-secondary sm:m-5 m-3   " onClick={(e) => {
                                // e.preventDefault();
                                router.push('/signup')
                            }}>Sign Up</button>
                            <button type="submit" className=" btn btn-secondary sm:m-5 m-3 " onClick={(e) => { }}>Submit</button>
                        </div>
                    </div>
                    {loading &&
                        <div className='bg-black/40	 absolute h-full w-full top-0 left-0 fadeIn'>
                            <LoadingView />
                        </div>
                    }
                </div>

            </form>}
        </LayoutWrapper>
    )
}

export default AdminPage
