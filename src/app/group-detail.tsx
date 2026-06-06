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
    StyleSheet,
} from "react-native";
import apiClient from "../api/apiClient";

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
    const [isAdmin, setIsAdmin] = useState(false);

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
                is_admin: isAdmin ? 1 : 0,
            });

            if (response.data.success) {
                Alert.alert("Success", "Member added successfully");
                setFullName("");
                setPhone("");
                setMemberCode("");
                setIsAdmin(false);
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
            <View style={styles.container}>
                <Text>{loading ? "Loading..." : "Group not found"}</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.groupCard}>
                    <View style={styles.cardTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>👥</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.groupName}>{group.group_name}</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{group.status}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        <Info icon="💱" label="Currency" value={group.currency} />
                        <Info icon="💰" label="Fund Amount" value={group.monthly_amount} />
                        <Info icon="👤" label="Members" value={`${members.length} / ${group.member_count}`} />
                        <Info icon="📅" label="Duration" value={`${group.duration_months} months`} />
                        <Info icon="📈" label="Bid Step" value={`${group.bid_step_percent}%`} />
                    </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={autoCreateRounds}>
                    <Text style={styles.primaryButtonText}>Auto Create Rounds</Text>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Members</Text>

                    <TouchableOpacity
                        onPress={() => setMemberModalOpen(true)}
                        style={styles.smallButton}
                    >
                        <Text style={styles.smallButtonText}>+ Add Member</Text>
                    </TouchableOpacity>
                </View>

                {members.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No members added yet.</Text>
                    </View>
                ) : (
                    members.map((member) => (
                        <View style={styles.memberCard} key={member.id}>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>
                                    {(member.full_name || "?").charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.memberName}>{member.full_name}</Text>
                                <Text style={styles.memberInfo}>Code: {member.member_code || "-"}</Text>
                                <Text style={styles.memberInfo}>Phone: {member.phone || "-"}</Text>
                                <Text style={styles.memberInfo}>
                                    Admin: {Number(member.is_admin) === 1 ? "Yes" : "No"}
                                </Text>
                            </View>
                        </View>
                    ))
                )}

                <Text style={styles.sectionTitle}>Rounds</Text>

                {rounds.map((round) => (
                    <TouchableOpacity
                        key={round.id}
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: "/round-detail",
                                params: { roundId: round.id },
                            })
                        }
                    >
                        <View style={styles.roundCard}>
                            <View style={styles.roundTop}>
                                <Text style={styles.roundTitle}>Round {round.round_no}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{round.status}</Text>
                                </View>
                            </View>

                            <Info icon="📉" label="Max Bid" value={round.max_bid_amount} />
                            <Info icon="💳" label="Each Member Pays" value={round.member_pay_amount} />
                            <Info icon="🏆" label="Winning Bid" value={round.winning_bid || "-"} />
                            <Info icon="➡️" label="Payout To" value={round.payout_to} />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal
                visible={memberModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setMemberModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Add Member</Text>

                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput value={fullName} onChangeText={setFullName} placeholder="Enter member name" style={styles.input} />

                        <Text style={styles.label}>Phone</Text>
                        <TextInput value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" style={styles.input} />

                        <Text style={styles.label}>Member Code</Text>
                        <TextInput value={memberCode} onChangeText={setMemberCode} placeholder="Example: M001" style={styles.input} />

                        <TouchableOpacity
                            onPress={() => setIsAdmin(!isAdmin)}
                            style={[styles.adminToggle, isAdmin && styles.adminToggleActive]}
                        >
                            <Text style={[styles.adminToggleText, isAdmin && styles.adminToggleTextActive]}>
                                {isAdmin ? "✓ Admin Member" : "Make This Member Admin"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setMemberModalOpen(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={addMember} style={styles.saveButton}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

function Info({ icon, label, value }: any) {
    return (
        <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>{icon}</Text>
            <View>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F6FA", padding: 16 },
    groupCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
    },
    cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#E8EFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    avatarText: { fontSize: 28 },
    groupName: { fontSize: 23, fontWeight: "900", color: "#111827" },
    statusBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#E7F8EF",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        marginTop: 6,
    },
    statusText: { color: "#0A8F3C", fontWeight: "800", textTransform: "capitalize" },
    infoGrid: { gap: 12 },
    infoItem: { flexDirection: "row", alignItems: "center", gap: 10 },
    infoIcon: { fontSize: 18 },
    infoLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
    infoValue: { fontSize: 16, color: "#111827", fontWeight: "800" },
    primaryButton: {
        height: 56,
        backgroundColor: "#1E63F3",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 21, fontWeight: "900", color: "#111827", marginBottom: 12 },
    smallButton: {
        backgroundColor: "#1E63F3",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 14,
    },
    smallButtonText: { color: "#fff", fontWeight: "900" },
    memberCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#EAF1FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    memberAvatarText: { fontSize: 20, fontWeight: "900", color: "#1E63F3" },
    memberName: { fontSize: 16, fontWeight: "900", color: "#111827" },
    memberInfo: { fontSize: 14, color: "#374151", marginTop: 2 },
    roundCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
        gap: 10,
    },
    roundTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    roundTitle: { fontSize: 17, fontWeight: "900", color: "#111827" },
    emptyCard: { backgroundColor: "#fff", padding: 18, borderRadius: 18, marginBottom: 14 },
    emptyText: { color: "#6B7280", fontWeight: "700" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        padding: 20,
    },
    modalBox: { backgroundColor: "#fff", borderRadius: 22, padding: 18 },
    modalTitle: { fontSize: 21, fontWeight: "900", marginBottom: 14 },
    label: { fontWeight: "800", marginBottom: 6, color: "#111827" },
    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#F9FAFB",
        borderRadius: 14,
        padding: 13,
        marginBottom: 12,
        fontSize: 16,
    },
    adminToggle: {
        backgroundColor: "#E5E7EB",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 12,
    },
    adminToggleActive: { backgroundColor: "#1E63F3" },
    adminToggleText: { color: "#111827", fontWeight: "900" },
    adminToggleTextActive: { color: "#fff" },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
    cancelButton: {
        flex: 1,
        backgroundColor: "#E5E7EB",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    saveButton: {
        flex: 1,
        backgroundColor: "#1E63F3",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    cancelText: { fontWeight: "900", color: "#111827" },
    saveText: { color: "#fff", fontWeight: "900" },
});