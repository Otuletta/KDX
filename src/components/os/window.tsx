"use client";

import React, { useState, useEffect } from "react";

interface OSWindowProps {
    children: React.ReactNode;
    title: string;
    pathname: string;
}

export function OSWindow({ children, pathname }: OSWindowProps) {
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        const start = window.requestAnimationFrame(() => setIsAnimating(true));
        const t = setTimeout(() => setIsAnimating(false), 20);
        return () => {
            window.cancelAnimationFrame(start);
            clearTimeout(t);
        };
    }, [pathname]);

    return (
        <div className={`flex flex-col h-full w-full transition-opacity duration-200 ease-out ${
            isAnimating ? "opacity-0" : "opacity-100"
        }`}>
            {children}
        </div>
    );
}
