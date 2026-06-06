import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import apiClient from "../api/apiClient";

export default function MemberListScreen() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadMembers = async () => {
        try {
            setLoading(true);

            const response = await apiClient.get("/members.php");

            if (response.data.success) {
                setMembers(response.data.data.members || []);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load members");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMembers();
        }, [])
    );

    return (
        <View style={{ flex: 1, backgroundColor: "#f4f6fb" }}>
            <View
                style={{
                    backgroundColor: "#111827",
                    paddingTop: 60,
                    paddingHorizontal: 18,
                    paddingBottom: 30,
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
                    Members
                </Text>

                <Text style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 21 }}>
                    View all registered members and their contact details.
                </Text>
            </View>

            <FlatList
                data={members}
                refreshing={loading}
                onRefresh={loadMembers}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{
                    padding: 16,
                    paddingTop: 24,
                    paddingBottom: 36,
                }}
                ListEmptyComponent={
                    !loading ? (
                        <View
                            style={{
                                backgroundColor: "#fff",
                                borderRadius: 22,
                                padding: 22,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 18, fontWeight: "900" }}>
                                No Members Found
                            </Text>
                            <Text style={{ color: "#64748b", marginTop: 6 }}>
                                Members will appear here after they are added.
                            </Text>
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 24,
                            padding: 16,
                            marginBottom: 14,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            shadowColor: "#000",
                            shadowOpacity: 0.05,
                            shadowRadius: 10,
                            elevation: 2,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 14,
                            }}
                        >
                            <View
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 18,
                                    backgroundColor: "#eff6ff",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                    borderWidth: 1,
                                    borderColor: "#bfdbfe",
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#2563eb",
                                        fontSize: 22,
                                        fontWeight: "900",
                                    }}
                                >
                                    {String(item.full_name || "?").charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: "900",
                                        color: "#111827",
                                    }}
                                >
                                    {item.full_name}
                                </Text>

                                <Text
                                    style={{
                                        color: "#64748b",
                                        marginTop: 3,
                                        fontWeight: "700",
                                    }}
                                >
                                    {item.member_code}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                backgroundColor: "#f8fafc",
                                borderRadius: 18,
                                padding: 14,
                                gap: 8,
                            }}
                        >
                            <Text style={{ color: "#475569", fontWeight: "700" }}>
                                Phone: {item.phone || "-"}
                            </Text>

                            <Text style={{ color: "#475569", fontWeight: "700" }}>
                                Email: {item.email || "-"}
                            </Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}