import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";

type User = {
    id: number;
    name: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    loadingAuth: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        loadStoredUser();
    }, []);

    const loadStoredUser = async () => {
        try {
            const savedUser = await AsyncStorage.getItem("auth_user");

            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.log("Load user error:", error);
        } finally {
            setLoadingAuth(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await apiClient.post("/login.php", {
            email,
            password,
        });

        console.log("LOGIN RESPONSE:", response.data);

        if (!response.data.success) {
            throw new Error(response.data.message || "Login failed");
        }

        const loggedUser = response.data.data.user;
        const token = response.data.data.token;

        if (!token) {
            throw new Error("Login token missing from API response");
        }

        await AsyncStorage.setItem("auth_user", JSON.stringify(loggedUser));
        await AsyncStorage.setItem("auth_token", token);

        console.log("TOKEN SAVED:", token);

        setUser(loggedUser);

        return loggedUser;
    };

    const logout = async () => {
        await AsyncStorage.removeItem("auth_user");
        await AsyncStorage.removeItem("auth_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loadingAuth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}