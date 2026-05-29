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
import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';

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
           {session.data?.user.isAdmin && <form onSubmit={handleSubmitForm} className='mx-auto max-w-xl'>
                <Surface className="relative overflow-hidden px-6 py-8 sm:px-10" >
                    <p className='mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300'>Admin</p>
                    <h4 className="text-left text-3xl font-bold text-white">Add Song</h4>
                    <div className="mt-8 space-y-5">
                        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">Song name is required before submission.</div>}
                        <TextField  {...register('name', { required: true })} type="text" placeholder={"Song Name"} />
                        <div className='rounded-[1.5rem] border border-white/10 bg-white/5 p-4'>
                            <h4 className="mb-3 text-left text-lg font-semibold text-white">Master</h4>
                            <div className='space-y-3'>
                                <TextField  {...register('masterRate', { valueAsNumber : true })} inputMode='decimal' placeholder={"Rate"} />
                                <TextField  {...register('masterCombo', { valueAsNumber: true })} type="number" placeholder={"Combo"} />
                            </div>
                        </div>
                        <div className='rounded-[1.5rem] border border-white/10 bg-white/5 p-4'>
                            <h4 className="mb-3 text-left text-lg font-semibold text-white">Ultima</h4>
                            <div className='space-y-3'>
                                <TextField  {...register('ultimaRate', { valueAsNumber: true })} type="number" placeholder={"Rate"} />
                                <TextField  {...register('ultimaCombo', { valueAsNumber: true })} type="number" placeholder={"Combo"} />
                            </div>
                        </div>
                        <div className='rounded-[1.5rem] border border-white/10 bg-white/5 p-4'>
                            <h4 className="mb-3 text-left text-lg font-semibold text-white">Expert</h4>
                            <div className='space-y-3'>
                                <TextField  {...register('expertRate', { valueAsNumber: true })} type="number" placeholder={"Rate"} />
                                <TextField  {...register('expertCombo', { valueAsNumber: true })} type="number" placeholder={"Combo"} />
                            </div>
                        </div>
                        <div className='flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center'>
                            <Button type='button' variant='secondary' onClick={() => {
                                router.push('/signup')
                            }}>Go To Signup</Button>
                            <Button type="submit">Save Song</Button>
                        </div>
                    </div>
                    {loading &&
                        <div className='absolute inset-0 bg-slate-950/35 backdrop-blur-sm'>
                            <LoadingView />
                        </div>
                    }
                </Surface>

            </form>}
        </LayoutWrapper>
    )
}

export default AdminPage
