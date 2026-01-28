import { User } from '@/types';
import { INSTRUCTORS } from '@/lib/constants';

const USERS_KEY = 'heli_users_v1';
const CURRENT_USER_KEY = 'heli_current_user_v1';

// Seed initial users if empty
const seedUsers = () => {
    const existing = localStorage.getItem(USERS_KEY);
    if (!existing) {
        const users: User[] = [
            { id: 'admin', username: 'admin', name: 'Jefe de Curso', role: 'admin', password: 'admin' },
            ...INSTRUCTORS.map(inst => ({
                id: inst.toLowerCase(),
                username: inst.toLowerCase(),
                name: inst,
                role: 'instructor' as const,
                password: '123' // Default password
            }))
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

export const authService = {
    init: () => {
        seedUsers();
    },

    login: (username: string, password: string): User | null => {
        authService.init();
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const user = users.find((u: User) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

        if (user) {
            const { password, ...safeUser } = user;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
            return safeUser;
        }
        return null;
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: (): User | null => {
        const data = localStorage.getItem(CURRENT_USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    // Admin only
    createUser: (user: User) => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};
