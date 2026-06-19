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

        const branches = await prisma.branch.findMany({
            include: {
                tenant: {
                    select: {
                        name: true,
                        slug: true
                    }
                },
                _count: {
                    select: {
                        users: true,
                        sales: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(branches);
    } catch (error) {
        console.error("Error fetching global branches:", error);
        return NextResponse.json(
            { error: "Error al obtener lista de sucursales" },
            { status: 500 }
        );
    }
}
