import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string; // Container className
    iconClassName?: string; // Icon vector className
    textClassName?: string; // Text styling
    showText?: boolean;
}

export function Logo({ className, iconClassName, textClassName, showText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            {/* The Logo Icon: a stylized flame inside a modern rounded box */}
            <div className={cn("flex items-center justify-center shrink-0", iconClassName)}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-full h-full"
                    fill="none"
                >
                    {/* Outer glowing ring/plate outline */}
                    <circle cx="24" cy="24" r="20" className="stroke-current" strokeWidth="3" opacity="0.2" />
                    
                    {/* Modern abstract flame / leaf / chop shape indicating hot food */}
                    <path
                        d="M24 8C24 8 16 16 16 26C16 32.6274 20.3726 36 24 36C27.6274 36 32 32.6274 32 26C32 16 24 8 24 8Z"
                        className="fill-current"
                    />
                    {/* Inner negative space for dynamism */}
                    <path
                        d="M24 18C24 18 20.5 22.5 20.5 28C20.5 30.5 22.5 33 24 33C25.5 33 27.5 30.5 27.5 28C27.5 22.5 24 18 24 18Z"
                        fill="white"
                    />
                    
                    {/* Bottom plate or base line */}
                    <path
                        d="M14 38C17 40.5 20.5 42 24 42C27.5 42 31 40.5 34 38"
                        className="stroke-current"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            
            {/* Text wordmark */}
            {showText && (
                <div className={cn("flex flex-col justify-center", textClassName)}>
                    <span className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">Salsealo</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1 leading-none">Cuisine OS</span>
                </div>
            )}
        </div>
    );
}
