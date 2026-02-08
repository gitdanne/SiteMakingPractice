/**
 * Simulated Database for EcoManure Market
 * Uses localStorage to persist user data and session state.
 */

const DB_KEY = 'ecoManureDB_v4'; // Bump version for roles & statuses
const SESSION_KEY = 'ecoManureSession';

const db = {
    // Helper: Determine Status based on Balance
    getStatus(balance) {
        if (balance >= 1000) return 'Harvester'; // VIP
        if (balance >= 500) return 'Bloomer';
        if (balance >= 100) return 'Sprout';
        return 'Seedling';
    },

    // Initialize DB if not exists
    init() {
        if (!localStorage.getItem(DB_KEY)) {
            const users = [
                // 1. Admin
                {
                    id: 'admin',
                    username: 'admin',
                    password: 'adminpassword123',
                    balance: 5000.00,
                    role: 'admin'
                },
                // 2. Moderators
                {
                    id: 'mod1',
                    username: 'mod1',
                    password: 'modpassword',
                    balance: 1500.00,
                    role: 'moderator'
                },
                {
                    id: 'mod2',
                    username: 'mod2',
                    password: 'modpassword',
                    balance: 800.00,
                    role: 'moderator'
                }
            ];

            // 3. Ordinary Users (22 randoms)
            for (let i = 1; i <= 22; i++) {
                const randomBalance = Math.floor(Math.random() * 2000); // 0 to 2000 range to see all statuses
                const randomSuffix = Math.random().toString(36).substring(7);
                users.push({
                    id: 'user_' + i,
                    username: 'user_' + i,
                    password: 'pass_' + randomSuffix,
                    balance: randomBalance,
                    role: 'user'
                });
            }

            const initialData = { users: users };
            localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        }
    },

    // Get all data
    getData() {
        // Ensure init is called securely or check if DB exists
        if (!localStorage.getItem(DB_KEY)) this.init();
        return JSON.parse(localStorage.getItem(DB_KEY));
    },

    // Save all data
    saveData(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    },

    // Create a new user
    createUser(username, password) {
        const data = this.getData();
        const userExists = data.users.find(u => u.username === username);

        if (userExists) {
            return { success: false, message: 'Username already taken' };
        }

        const newUser = {
            id: 'u' + Date.now(),
            username: username,
            password: password, // In a real app, this should be hashed!
            balance: 0.00,
            role: 'user' // Default role
        };

        data.users.push(newUser);
        this.saveData(data);
        return { success: true, user: newUser };
    },

    // Authenticate user
    login(username, password) {
        const data = this.getData();
        const user = data.users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return { success: true, user: user };
        }

        return { success: false, message: 'Invalid credentials' };
    },

    // Get currently logged in user
    getCurrentUser() {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;

        // Refresh from DB to get latest balance
        const sessionUser = JSON.parse(session);
        const data = this.getData();
        const freshUser = data.users.find(u => u.id === sessionUser.id);

        // If user was deleted or something, logout
        if (!freshUser) {
            this.logout();
            return null;
        }

        return freshUser;
    },

    // Logout
    logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.reload();
    },

    // Top up balance
    topUp(amount) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Not logged in' };

        const data = this.getData();
        const dbUser = data.users.find(u => u.id === user.id);

        if (dbUser) {
            dbUser.balance += parseFloat(amount);
            this.saveData(data);
            return { success: true, newBalance: dbUser.balance };
        }
        return { success: false, message: 'User not found' };
    },

    // Deduct balance
    deductBalance(amount) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Not logged in' };

        const data = this.getData();
        const dbUser = data.users.find(u => u.id === user.id);

        if (dbUser) {
            if (dbUser.balance >= amount) {
                dbUser.balance -= parseFloat(amount);
                this.saveData(data);
                return { success: true, newBalance: dbUser.balance };
            } else {
                return { success: false, message: 'Insufficient funds' };
            }
        }
        return { success: false, message: 'User not found' };
    },

    // Transfer funds to another user
    transferFunds(recipientUsername, amount) {
        const sender = this.getCurrentUser();
        if (!sender) return { success: false, message: 'Not logged in' };

        const data = this.getData();
        const dbSender = data.users.find(u => u.id === sender.id);
        const dbRecipient = data.users.find(u => u.username === recipientUsername);

        if (!dbRecipient) {
            return { success: false, message: 'Recipient not found' };
        }

        if (dbSender.username === dbRecipient.username) {
            return { success: false, message: 'Cannot transfer to yourself' };
        }

        if (dbSender.balance < amount) {
            return { success: false, message: 'Insufficient funds' };
        }

        // Execute Transfer
        dbSender.balance -= parseFloat(amount);
        dbRecipient.balance += parseFloat(amount);

        this.saveData(data);
        return { success: true, newBalance: dbSender.balance };
    }
};

// Initialize on load
db.init();

// Expose to window for global access
window.db = db;
