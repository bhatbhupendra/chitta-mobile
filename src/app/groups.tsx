import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from "react-native";
import apiClient from "../api/apiClient";

export default function GroupListScreen() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadGroups = async () => {
        try {
            setLoading(true);

            const response = await apiClient.get("/groups.php");

            if (response.data.success) {
                setGroups(response.data.data.groups || []);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load groups");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [])
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push("/group-create")}
            >
                <View style={styles.plusCircle}>
                    <Text style={styles.plusText}>+</Text>
                </View>
                <Text style={styles.createText}>Create New Group</Text>
            </TouchableOpacity>

            <FlatList
                data={groups}
                refreshing={loading}
                onRefresh={loadGroups}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: "/group-detail",
                                params: { groupId: item.id },
                            })
                        }
                    >
                        <View style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={[styles.avatar, index % 2 === 0 ? styles.avatarBlue : styles.avatarGreen]}>
                                    <Text style={styles.avatarIcon}>👥</Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.groupName}>{item.group_name}</Text>
                                </View>

                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                                </View>

                                <Text style={styles.arrow}>›</Text>
                            </View>

                            <View style={styles.infoGrid}>
                                <View style={styles.infoBox}>
                                    <Text style={styles.icon}>💰</Text>
                                    <Text style={styles.label}>Fund Amount</Text>
                                    <Text style={styles.value}>
                                        {item.currency} {Number(item.monthly_amount).toLocaleString()}
                                    </Text>
                                </View>

                                <View style={styles.infoBox}>
                                    <Text style={styles.icon}>👤</Text>
                                    <Text style={styles.label}>Members</Text>
                                    <Text style={styles.value}>{item.member_count}</Text>
                                </View>

                                <View style={styles.infoBox}>
                                    <Text style={styles.icon}>📅</Text>
                                    <Text style={styles.label}>Duration</Text>
                                    <Text style={styles.value}>{item.duration_months} months</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.bottomRow}>
                                <View style={styles.bottomItem}>
                                    <Text style={styles.icon}>📈</Text>
                                    <View>
                                        <Text style={styles.label}>Bid Step</Text>
                                        <Text style={styles.value}>{item.bid_step_percent}%</Text>
                                    </View>
                                </View>

                                <View style={styles.bottomItem}>
                                    <Text style={styles.icon}>🛡️</Text>
                                    <View>
                                        <Text style={styles.label}>Status</Text>
                                        <Text style={styles.value}>{item.status}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F6FA",
        padding: 16,
    },

    createButton: {
        height: 62,
        backgroundColor: "#1E63F3",
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        marginBottom: 18,
        shadowColor: "#1E63F3",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },

    plusCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    plusText: {
        fontSize: 28,
        color: "#1E63F3",
        fontWeight: "700",
        marginTop: -2,
    },

    createText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "800",
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },

    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },

    avatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    avatarBlue: {
        backgroundColor: "#E8EFFF",
    },

    avatarGreen: {
        backgroundColor: "#E7F8EF",
    },

    avatarIcon: {
        fontSize: 25,
    },

    groupName: {
        fontSize: 21,
        fontWeight: "900",
        color: "#111827",
    },

    statusBadge: {
        backgroundColor: "#E7F8EF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
    },

    statusBadgeText: {
        color: "#0A8F3C",
        fontWeight: "800",
        textTransform: "capitalize",
    },

    arrow: {
        fontSize: 34,
        color: "#111827",
        marginTop: -3,
    },

    infoGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    infoBox: {
        flex: 1,
        paddingRight: 8,
    },

    icon: {
        fontSize: 18,
        marginBottom: 4,
    },

    label: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 4,
    },

    value: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },

    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 16,
    },

    bottomRow: {
        flexDirection: "row",
    },

    bottomItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
});