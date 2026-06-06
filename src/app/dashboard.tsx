import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
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
        ["Total Groups", stats?.total_groups || 0, "#eff6ff"],
        ["Total Members", stats?.total_members || 0, "#ecfdf5"],
        ["Open Rounds", stats?.open_rounds || 0, "#fff7ed"],
        ["Completed Rounds", stats?.completed_rounds || 0, "#f5f3ff"],
        ["Pending Payments", stats?.pending_payments || 0, "#fef2f2"],
        ["Total Payouts", stats?.total_payouts || 0, "#f0fdfa"],
    ];

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "#f4f6fb" }}
            contentContainerStyle={{ paddingBottom: 36 }}
        >
            <View
                style={{
                    backgroundColor: "#111827",
                    paddingTop: 60,
                    paddingHorizontal: 18,
                    paddingBottom: 28,
                    borderBottomLeftRadius: 34,
                    borderBottomRightRadius: 34,
                }}
            >
                <Text style={{ color: "#cbd5e1", fontWeight: "800" }}>
                    Chitta Admin
                </Text>

                <Text
                    style={{
                        color: "#fff",
                        fontSize: 32,
                        fontWeight: "900",
                        marginTop: 6,
                    }}
                >
                    Dashboard
                </Text>

                <Text
                    style={{
                        color: "#cbd5e1",
                        marginTop: 8,
                        lineHeight: 21,
                    }}
                >
                    Manage groups, members, rounds, payments and bids from one place.
                </Text>
            </View>

            <View style={{ padding: 16, marginTop: 18 }}>
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                    }}
                >
                    {statItems.map(([label, value, bg]) => (
                        <View
                            key={label}
                            style={{
                                width: "48%",
                                backgroundColor: bg as string,
                                borderRadius: 22,
                                padding: 15,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                            }}
                        >
                            <Text
                                style={{
                                    color: "#64748b",
                                    fontSize: 12,
                                    fontWeight: "800",
                                }}
                            >
                                {label}
                            </Text>

                            <Text
                                style={{
                                    fontSize: 28,
                                    fontWeight: "900",
                                    marginTop: 8,
                                    color: "#111827",
                                }}
                            >
                                {value}
                            </Text>
                        </View>
                    ))}
                </View>

                <View
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 26,
                        padding: 18,
                        marginTop: 8,
                        shadowColor: "#000",
                        shadowOpacity: 0.07,
                        shadowRadius: 14,
                        elevation: 4,
                    }}
                >
                    <Text style={{ fontSize: 22, fontWeight: "900", marginBottom: 4 }}>
                        Quick Actions
                    </Text>

                    <Text style={{ color: "#64748b", marginBottom: 16 }}>
                        Choose what you want to manage today.
                    </Text>

                    <AppButton
                        title="Manage Groups"
                        onPress={() => router.push("/groups")}
                    />

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
                </View>

                <TouchableOpacity
                    onPress={handleLogout}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: "#fee2e2",
                        borderRadius: 18,
                        paddingVertical: 15,
                        alignItems: "center",
                        marginTop: 16,
                        borderWidth: 1,
                        borderColor: "#fecaca",
                    }}
                >
                    <Text style={{ color: "#dc2626", fontWeight: "900" }}>
                        Logout
                    </Text>
                </TouchableOpacity>

                {loading ? (
                    <Text
                        style={{
                            textAlign: "center",
                            marginTop: 12,
                            color: "#64748b",
                            fontWeight: "700",
                        }}
                    >
                        Loading...
                    </Text>
                ) : null}
            </View>
        </ScrollView>
    );
}