import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Check if it's an  image
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Only images are allowed" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name);
        const randomName = randomBytes(16).toString("hex");
        const filename = `${randomName}${ext}`;

        // Save to public/uploads/products
        const uploadPath = path.join(process.cwd(), "public/uploads/products", filename);
        await writeFile(uploadPath, buffer);

        // Return public URL
        const imageUrl = `/uploads/products/${filename}`;

        return NextResponse.json({ imageUrl }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}
