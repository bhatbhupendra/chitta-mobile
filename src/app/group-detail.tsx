import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";

export default function GroupDetailScreen() {
    const { groupId } = useLocalSearchParams();

    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [rounds, setRounds] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [memberCode, setMemberCode] = useState("");

    const loadGroup = async () => {
        try {
            setLoading(true);

            const response = await apiClient.get(`/group_view.php?id=${groupId}`);

            if (response.data.success) {
                setGroup(response.data.data.group);
                setMembers(response.data.data.members || []);
                setRounds(response.data.data.rounds || []);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load group");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadGroup();
        }, [groupId])
    );

    const autoCreateRounds = async () => {
        try {
            const response = await apiClient.post("/group_autocreate_rounds.php", {
                group_id: Number(groupId),
            });

            if (response.data.success) {
                Alert.alert("Success", "Rounds created successfully");
                loadGroup();
            } else {
                Alert.alert("Error", response.data.message || "Failed to create rounds");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        }
    };

    const addMember = async () => {
        if (!fullName.trim()) {
            Alert.alert("Validation Error", "Member name is required");
            return;
        }

        try {
            const response = await apiClient.post("/group_add_member.php", {
                group_id: Number(groupId),
                full_name: fullName.trim(),
                phone: phone.trim(),
                member_code: memberCode.trim(),
            });

            if (response.data.success) {
                Alert.alert("Success", "Member added successfully");

                setFullName("");
                setPhone("");
                setMemberCode("");
                setMemberModalOpen(false);

                loadGroup();
            } else {
                Alert.alert("Error", response.data.message || "Failed to add member");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        }
    };

    if (!group) {
        return (
            <View style={{ flex: 1, padding: 16 }}>
                <Text>{loading ? "Loading..." : "Group not found"}</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={{ flex: 1, padding: 16 }}>
                <AppCard>
                    <Text style={{ fontSize: 22, fontWeight: "800" }}>
                        {group.group_name}
                    </Text>
                    <Text>Currency: {group.currency}</Text>
                    <Text>Fund Amount: {group.monthly_amount}</Text>
                    <Text>Members: {members.length} / {group.member_count}</Text>
                    <Text>Duration: {group.duration_months} months</Text>
                    <Text>Bid Step: {group.bid_step_percent}%</Text>
                    <Text>Status: {group.status}</Text>
                </AppCard>

                <AppButton title="Auto Create Rounds" onPress={autoCreateRounds} />

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginVertical: 10,
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "800" }}>
                        Members
                    </Text>

                    <TouchableOpacity
                        onPress={() => setMemberModalOpen(true)}
                        style={{
                            backgroundColor: "#1677ff",
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ color: "#fff", fontWeight: "800" }}>
                            + Add Member
                        </Text>
                    </TouchableOpacity>
                </View>

                {members.length === 0 ? (
                    <AppCard>
                        <Text>No members added yet.</Text>
                    </AppCard>
                ) : (
                    members.map((member) => (
                        <AppCard key={member.id}>
                            <Text style={{ fontWeight: "800" }}>{member.full_name}</Text>
                            <Text>Code: {member.member_code || "-"}</Text>
                            <Text>Phone: {member.phone || "-"}</Text>
                        </AppCard>
                    ))
                )}

                <Text style={{ fontSize: 18, fontWeight: "800", marginVertical: 10 }}>
                    Rounds
                </Text>

                {rounds.map((round) => (
                    <TouchableOpacity
                        key={round.id}
                        onPress={() =>
                            router.push({
                                pathname: "/round-detail",
                                params: { roundId: round.id },
                            })
                        }
                    >
                        <AppCard>
                            <Text style={{ fontWeight: "800" }}>Round {round.round_no}</Text>
                            <Text>Status: {round.status}</Text>
                            <Text>Max Bid: {round.max_bid_amount}</Text>
                            <Text>Each Member Pays: {round.member_pay_amount}</Text>
                            <Text>Winning Bid: {round.winning_bid || "-"}</Text>
                            <Text>Payout To: {round.payout_to}</Text>
                        </AppCard>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal
                visible={memberModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setMemberModalOpen(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        justifyContent: "center",
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 14,
                            padding: 18,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "800",
                                marginBottom: 14,
                            }}
                        >
                            Add Member
                        </Text>

                        <Text style={{ fontWeight: "700", marginBottom: 5 }}>
                            Full Name *
                        </Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter member name"
                            style={inputStyle}
                        />

                        <Text style={{ fontWeight: "700", marginBottom: 5 }}>
                            Phone
                        </Text>
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                            style={inputStyle}
                        />

                        <Text style={{ fontWeight: "700", marginBottom: 5 }}>
                            Member Code
                        </Text>
                        <TextInput
                            value={memberCode}
                            onChangeText={setMemberCode}
                            placeholder="Example: M001"
                            style={inputStyle}
                        />

                        <View
                            style={{
                                flexDirection: "row",
                                gap: 10,
                                marginTop: 10,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => setMemberModalOpen(false)}
                                style={{
                                    flex: 1,
                                    backgroundColor: "#ddd",
                                    padding: 13,
                                    borderRadius: 10,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontWeight: "800" }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={addMember}
                                style={{
                                    flex: 1,
                                    backgroundColor: "#1677ff",
                                    padding: 13,
                                    borderRadius: 10,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "800" }}>
                                    Save
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const inputStyle = {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
};