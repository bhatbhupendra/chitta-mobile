import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import apiClient from "../api/apiClient";
import AppCard from "../components/AppCard";

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
        <View style={{ flex: 1, padding: 16 }}>
            <FlatList
                data={members}
                refreshing={loading}
                onRefresh={loadMembers}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <AppCard>
                        <Text style={{ fontSize: 18, fontWeight: "800" }}>
                            {item.full_name}
                        </Text>
                        <Text>Member Code: {item.member_code}</Text>
                        <Text>Phone: {item.phone}</Text>
                        <Text>Email: {item.email}</Text>
                    </AppCard>
                )}
            />
        </View>
    );
}