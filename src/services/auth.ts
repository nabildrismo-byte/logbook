import { User } from '@/types';


const USERS_KEY = 'heli_users_v1';
const CURRENT_USER_KEY = 'heli_current_user_v1';

// Seed initial users if empty or force update for v2 security
const seedUsers = () => {
    // Passwords: 5 chars, letters + numbers
    const users: User[] = [
        { id: 'admin', username: 'admin', name: 'Jefe de Curso', role: 'admin', password: 'admin' },
        { id: 'izquierdo', username: 'izquierdo', name: 'IZQUIERDO', role: 'instructor', password: 'zkq85' },
        { id: 'dris', username: 'dris', name: 'DRIS', role: 'instructor', password: 'dr73s' },
        { id: 'rodriguez', username: 'rodriguez', name: 'RODRIGUEZ', role: 'instructor', password: 'rdz92' },
        { id: 'prieto', username: 'prieto', name: 'PRIETO', role: 'instructor', password: 'pr12t' },
        { id: 'benjumea', username: 'benjumea', name: 'BENJUMEA', role: 'instructor', password: 'bnj47' },
        { id: 'soriano', username: 'soriano', name: 'SORIANO', role: 'instructor', password: 'srn63' },
        { id: 'duenas', username: 'dueñas', name: 'DUEÑAS', role: 'instructor', password: 'dn58s' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
    init: () => {
        seedUsers();
    },

    login: (username: string, password: string): User | null => {
        authService.init();
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

        // Case insensitive match for both username and password
        const user = users.find((u: User) =>
            u.username.toLowerCase() === username.trim().toLowerCase() &&
            (u.password || '').toLowerCase() === password.trim().toLowerCase()
        );

        if (user) {
            const { password, ...safeUser } = user;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

            // Track Login
            const history = JSON.parse(localStorage.getItem('heli_login_history_v1') || '[]');
            history.unshift({
                name: user.name,
                username: user.username,
                timestamp: new Date().toISOString()
            });
            // Keep only last 100 logins
            if (history.length > 100) history.pop();
            localStorage.setItem('heli_login_history_v1', JSON.stringify(history));

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
    },

    getLoginHistory: () => {
        return JSON.parse(localStorage.getItem('heli_login_history_v1') || '[]');
    }
};
