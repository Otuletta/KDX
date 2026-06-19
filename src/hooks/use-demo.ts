import { useState, useEffect } from 'react';
import { getCurrentSession } from '@/app/actions/auth';

export function useDemo() {
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        getCurrentSession().then((session) => {
            if (session?.user?.role === 'DEMO') {
                setIsDemo(true);
            }
        });
    }, []);

    return { isDemo };
}
