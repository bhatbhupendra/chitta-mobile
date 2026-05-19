import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";

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
        <View style={{ flex: 1, padding: 16 }}>
            <AppButton title="Create New Group" onPress={() => router.push("/group-create")} />

            <FlatList
                data={groups}
                refreshing={loading}
                onRefresh={loadGroups}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: "/group-detail",
                                params: { groupId: item.id },
                            })
                        }
                    >
                        <AppCard>
                            <Text style={{ fontSize: 18, fontWeight: "800" }}>
                                {item.group_name}
                            </Text>

                            <Text>
                                Fund Amount: {item.currency} {item.monthly_amount}
                            </Text>
                            <Text>Members: {item.member_count}</Text>
                            <Text>Duration: {item.duration_months} months</Text>
                            <Text>Bid Step: {item.bid_step_percent}%</Text>
                            <Text>Status: {item.status}</Text>
                        </AppCard>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}