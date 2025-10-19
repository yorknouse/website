"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";

export default function SignInPage() {
    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center"
            style={{
                backgroundImage:
                    "url('https://bbcdn.nouse.co.uk/file/nouseSiteAssets/headerImages/centralhall-comp.jpg')",
            }}
        >
            <div className="bg-white/95 shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
                <div className="flex justify-center mb-6 mt-2">
                    <Image
                        src={"https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-full3.svg"}
                        alt={"Nouse logo"}
                        width={240}
                        height={80}
                        className={"object-contain"}
                    />
                </div>
                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="flex items-center justify-center gap-3 w-full py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200"
                >
                    <FcGoogle size={22} />
                    <span className="font-medium">Sign in with Google</span>
                </button>
            </div>
        </div>
    );
}
