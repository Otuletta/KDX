"use server";

import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { encrypt } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contraseña requeridos" };
    }

    try {
        // @ts-ignore
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return { error: "Credenciales inválidas" };
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
            return { error: "Credenciales inválidas" };
        }

        // Create session
        const sessionData = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        const token = await encrypt(sessionData);

        (await cookies()).set("session", token, {
            expires: sessionData.expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

    } catch (error) {
        console.error("Login Error:", error);
        return { error: "Error de servidor" };
    }

    redirect("/");
}

export async function logout() {
    (await cookies()).set("session", "", { expires: new Date(0) });
    redirect("/login");
}

export async function getCurrentSession() {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    return session;
}
