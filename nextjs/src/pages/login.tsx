import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from "react-hook-form";

import Image from "next/image";
import LoadingView from "components/LoadingView";
import LayoutWrapper from "components/LayoutWrapper";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";

type FormData = {
  username: string;
  password: string;
};

type Query = {
  callbackUrl?: string;
};
export default function Login() {
  // const { login } = useUserContext()
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  // const checkValid = () => {
  //     login(email,password).catch(e => {
  //         setError(true)
  //     })
  // }

  const handleSubmitForm = handleSubmit(async (values) => {
    const { password, username } = values;
    setLoading(true);
    try {
      let result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        throw result.error;
      }
      // const query: Query = router.query
      // console.log("🚀 ~ file: login.tsx ~ line 42 ~ signIn ~ query.callbackUrl", query.callbackUrl)

      router.replace("/home");
    } catch (e) {
      console.log("🚀 ~ file: login.tsx ~ line 44 ~ signIn ~ e", e);
      alert(e);
      setLoading(false);
      console.log("login", e);
    }
  });

  const error: boolean =
    errors?.password?.type === "required" ||
    errors?.username?.type === "required";
  return (
    <LayoutWrapper>
      <form onSubmit={handleSubmitForm} className="mx-auto max-w-xl">
        <Surface className="relative overflow-hidden px-6 py-8 text-center sm:px-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
            Welcome Back
          </p>
          <h1 className="text-3xl font-bold text-white">
            Sign in to Chuni-Log
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Access your rating tables, song tools, and game rooms.
          </p>
          <div className="mt-8 space-y-4 text-left">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                Please check your username and password.
              </div>
            )}
            <TextField
              {...register("username", { required: true })}
              autoComplete="username"
              type="text"
              placeholder={"Username"}
            />
            <TextField
              {...register("password", { required: true })}
              autoComplete="current-password"
              type="password"
              placeholder={"Password"}
            />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                router.push("/signup");
              }}
            >
              Create Account
            </Button>
            <Button type="submit">Login</Button>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm">
              <LoadingView />
            </div>
          )}
        </Surface>
      </form>
    </LayoutWrapper>
  );
}
