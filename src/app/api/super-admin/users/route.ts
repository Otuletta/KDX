import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();

        // Strict Super Admin Verification
        if (!session?.user?.isSuperAdmin) {
            return NextResponse.json({ error: "Acceso denegado. Se requiere nivel de Super Administrador." }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            include: {
                tenant: {
                    select: {
                        name: true,
                        slug: true
                    }
                },
                branches: {
                    include: {
                        branch: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching global users:", error);
        return NextResponse.json(
            { error: "Error al obtener lista de usuarios" },
            { status: 500 }
        );
    }
}
