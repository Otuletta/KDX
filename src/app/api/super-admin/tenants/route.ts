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

        const tenants = await prisma.tenant.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        branches: true,
                        products: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(tenants);
    } catch (error) {
        console.error("Error fetching global tenants:", error);
        return NextResponse.json(
            { error: "Error al obtener lista de empresas" },
            { status: 500 }
        );
    }
}
