"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { encrypt } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function login(prevState: unknown, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email y contraseña requeridos" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { branches: true },
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
                tenantId: user.tenantId,
                branchId: user.branches?.[0]?.branchId || null,
                isSuperAdmin: user.isSuperAdmin,
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
