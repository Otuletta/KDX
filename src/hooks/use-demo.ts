import { useState, useEffect } from 'react';
import { getCurrentSession } from '@/app/actions/auth';

export function useDemo() {
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentSession().then((session) => {
            if (session?.user?.role === 'DEMO') {
                setIsDemo(true);
            }
            setLoading(false);
        });
    }, []);

    return { isDemo, loading };
}
