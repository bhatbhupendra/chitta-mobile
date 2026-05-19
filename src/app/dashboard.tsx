import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import { useAuth } from "../context/AuthContext";

export default function DashboardScreen() {
    const { logout } = useAuth();

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const response = await apiClient.get("/dashboard.php");

            if (response.data.success) {
                setStats(response.data.data);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load dashboard");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const handleLogout = async () => {
        await logout();
        router.replace("/");
    };

    const statItems = [
        ["Total Groups", stats?.total_groups || 0],
        ["Total Members", stats?.total_members || 0],
        ["Open Rounds", stats?.open_rounds || 0],
        ["Completed Rounds", stats?.completed_rounds || 0],
        ["Pending Payments", stats?.pending_payments || 0],
        ["Total Payouts", stats?.total_payouts || 0],
    ];

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 14 }}>
                Dashboard
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {statItems.map(([label, value]) => (
                    <View
                        key={label}
                        style={{
                            width: "48%",
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: "#eee",
                            marginBottom: 10,
                        }}
                    >
                        <Text style={{ color: "#666", fontSize: 13 }}>{label}</Text>
                        <Text style={{ fontSize: 24, fontWeight: "800", marginTop: 6 }}>
                            {value}
                        </Text>
                    </View>
                ))}
            </View>

            <AppCard>
                <AppButton title="Manage Groups" onPress={() => router.push("/groups")} />

                <AppButton
                    title="Manage Members"
                    onPress={() => router.push("/members")}
                    variant="secondary"
                />

                <AppButton
                    title="Member Self Bid"
                    onPress={() => router.push("/member-bid")}
                    variant="secondary"
                />
            </AppCard>

            <TouchableOpacity onPress={handleLogout} style={{ alignItems: "center", marginTop: 12 }}>
                <Text style={{ color: "red", fontWeight: "700" }}>Logout</Text>
            </TouchableOpacity>

            {loading ? (
                <Text style={{ textAlign: "center", marginTop: 10 }}>Loading...</Text>
            ) : null}
        </ScrollView>
    );
}