import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        console.log('🧹 FORCE CLEANING DEMO DATA...');

        const demoWhere = { isDemo: true };

        // Transaction to ensure cleanup is atomic
        const deleted = await prisma.$transaction(async (tx) => {
            const sales = await tx.sale.deleteMany({ where: demoWhere });
            const products = await tx.product.deleteMany({ where: demoWhere });
            const ingredients = await tx.ingredient.deleteMany({ where: demoWhere });
            const recipes = await tx.recipe.deleteMany({ where: demoWhere });
            const suppliers = await tx.supplier.deleteMany({ where: demoWhere });

            // Clean related tables (cascade-like manual cleanup if needed, but deleteMany usually handles harmlessly if no cascade constraint blocks it)
            // For strictness:
            await tx.saleItem.deleteMany({ where: { sale: demoWhere } });

            return { sales, products, ingredients, recipes, suppliers };
        });

        return NextResponse.json({
            success: true,
            message: "Demo data cleaned successfully.",
            counts: deleted
        });
    } catch (error) {
        console.error("Error cleaning data:", error);
        return NextResponse.json({ error: "Failed to clean data", details: String(error) }, { status: 500 });
    }
}
