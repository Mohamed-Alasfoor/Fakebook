import { useRouter } from 'next/router';

export function useNavigation() {
    const router = useRouter();

    const goToHome = () => router.push('/');
    const goToLogin = () => router.push('/login');

    return {
        goToHome,
        goToLogin,
    }
}
