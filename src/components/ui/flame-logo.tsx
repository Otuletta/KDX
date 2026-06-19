export function FlameLogo({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* The Outer Circle */}
            <circle cx="50" cy="50" r="45" stroke="#fca5a5" strokeWidth="8" />
            
            {/* The Flame Center */}
            <path
                d="M50 20 C50 20, 20 45, 20 65 C20 81.5 33.5 95 50 95 C66.5 95 80 81.5 80 65 C80 45, 50 20, 50 20 Z"
                fill="#ef4444"
            />
            
            {/* Inner negative space for flame */}
            <path
                d="M50 35 C50 35, 35 50, 35 65 C35 73.2 41.8 80 50 80 C58.2 80 65 73.2 65 65 C65 50, 50 35, 50 35 Z"
                fill="white"
            />
            {/* The smile at the bottom */}
            <path
                d="M35 75 Q 50 90 65 75"
                stroke="#ef4444"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}
