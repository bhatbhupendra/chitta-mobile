import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import apiClient from "../api/apiClient";

type Charge = {
    name: string;
    type: "percent" | "fixed";
    value: string;
};

export default function RoundDetailScreen() {
    const { roundId } = useLocalSearchParams();

    const [round, setRound] = useState<any>(null);
    const [contributions, setContributions] = useState<any[]>([]);
    const [bids, setBids] = useState<any[]>([]);
    const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
    const [selectedGroupMemberId, setSelectedGroupMemberId] = useState("");
    const [bidAmount, setBidAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const [showBillForm, setShowBillForm] = useState(false);
    const [charges, setCharges] = useState<Charge[]>([
        { name: "Commission", type: "percent", value: "1" },
        { name: "App Charge", type: "percent", value: "0.1" },
    ]);

    const loadRound = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/round_view.php?id=${roundId}`);
            if (response.data.success) {
                setRound(response.data.data.round);
                setContributions(response.data.data.contributions || []);
                setBids(response.data.data.bids || []);
                setEligibleMembers(response.data.data.eligible_members || []);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load round");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadRound();
        }, [roundId])
    );

    const togglePayment = async (contributionId: number, status: string) => {
        try {
            const response = await apiClient.post("/payment_toggle.php", {
                contribution_id: contributionId,
                status,
            });
            if (response.data.success) {
                loadRound();
            } else {
                Alert.alert("Error", response.data.message || "Payment update failed");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        }
    };

    const placeAdminBid = async () => {
        if (!selectedGroupMemberId || !bidAmount) {
            Alert.alert("Validation", "Enter group member ID and bid amount");
            return;
        }
        try {
            const response = await apiClient.post("/bid_place.php", {
                round_id: Number(roundId),
                group_member_id: Number(selectedGroupMemberId),
                bid_amount: Number(bidAmount),
            });
            if (response.data.success) {
                Alert.alert("Success", "Bid placed successfully");
                setSelectedGroupMemberId("");
                setBidAmount("");
                loadRound();
            } else {
                Alert.alert("Error", response.data.message || "Bid failed");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        }
    };

    const closeRound = async () => {
        try {
            const response = await apiClient.post("/round_close.php", {
                round_id: Number(roundId),
            });
            if (response.data.success) {
                Alert.alert("Success", "Round closed successfully");
                loadRound();
            } else {
                Alert.alert("Error", response.data.message || "Round close failed");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        }
    };

    const addCharge = () => {
        setCharges([...charges, { name: "", type: "percent", value: "" }]);
    };

    const removeCharge = (index: number) => {
        setCharges(charges.filter((_, i) => i !== index));
    };

    const updateCharge = (index: number, key: keyof Charge, value: string) => {
        const updated = [...charges];
        updated[index] = { ...updated[index], [key]: value };
        setCharges(updated);
    };

    const getWinningAmount = () => {
        return Number(round?.winning_bid || round?.fund_amount || 0);
    };

    const calculateChargeAmount = (charge: Charge) => {
        const winningAmount = getWinningAmount();
        const value = Number(charge.value || 0);
        return charge.type === "percent" ? (winningAmount * value) / 100 : value;
    };

    const totalCharges = charges.reduce((sum, charge) => sum + calculateChargeAmount(charge), 0);
    const receivableAmount = getWinningAmount() - totalCharges;

    const createBill = async () => {
        const validCharges = charges.filter(
            (charge) => charge.name.trim() !== "" && Number(charge.value) >= 0
        );
        if (validCharges.length <= 0) {
            Alert.alert("Validation", "Please add at least one charge");
            return;
        }
        try {
            const response = await apiClient.post("/round_bill_create.php", {
                round_id: Number(roundId),
                charges: validCharges.map((charge) => ({
                    name: charge.name,
                    type: charge.type,
                    value: Number(charge.value),
                })),
            });
            if (response.data.success) {
                Alert.alert("Success", "Bill created successfully");
                setShowBillForm(false);
                loadRound();
            } else {
                Alert.alert("Error", response.data.message || "Bill creation failed");
            }
        } catch {
            Alert.alert("Error", "Could not connect to server");
        }
    };

    if (!round) {
        return (
            <View style={styles.container}>
                <Text>{loading ? "Loading..." : "Round not found"}</Text>
            </View>
        );
    }

    const isRoundOne = Number(round.round_no) === 1;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* ── Round Info Card ── */}
            <View style={styles.roundCard}>
                <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>🔄</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.roundTitle}>Round {round.round_no}</Text>
                        <View style={[
                            styles.statusBadge,
                            round.status === "closed" && styles.statusBadgeClosed,
                        ]}>
                            <Text style={[
                                styles.statusText,
                                round.status === "closed" && styles.statusTextClosed,
                            ]}>
                                {round.status}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoGrid}>
                    <Info icon="💰" label="Fund Amount" value={round.fund_amount} />
                    <Info icon="📉" label="Max Allowed Bid" value={round.max_bid_amount} />
                    <Info icon="💳" label="Each Member Pays" value={round.member_pay_amount} />
                    <Info icon="🏆" label="Winning Bid" value={round.winning_bid || "-"} />
                    <Info icon="➡️" label="Payout To" value={round.payout_to} />
                </View>
            </View>

            {/* ── Create Bill ── */}
            {round.status === "closed" && !round.bill ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill</Text>

                    {!showBillForm ? (
                        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowBillForm(true)}>
                            <Text style={styles.primaryButtonText}>Create Bill</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.card}>
                            <Info icon="🏆" label="Winning Amount" value={getWinningAmount().toFixed(2)} />

                            {charges.map((charge, index) => (
                                <View key={index} style={styles.chargeBox}>
                                    <Text style={styles.label}>Charge Name</Text>
                                    <TextInput
                                        value={charge.name}
                                        onChangeText={(text) => updateCharge(index, "name", text)}
                                        placeholder="e.g. Commission"
                                        style={styles.input}
                                    />

                                    <Text style={styles.label}>Charge Type</Text>
                                    <View style={styles.toggleRow}>
                                        <TouchableOpacity
                                            onPress={() => updateCharge(index, "type", "percent")}
                                            style={[styles.toggleBtn, charge.type === "percent" && styles.toggleBtnActive]}
                                        >
                                            <Text style={[styles.toggleBtnText, charge.type === "percent" && styles.toggleBtnTextActive]}>
                                                Percent
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => updateCharge(index, "type", "fixed")}
                                            style={[styles.toggleBtn, charge.type === "fixed" && styles.toggleBtnActive]}
                                        >
                                            <Text style={[styles.toggleBtnText, charge.type === "fixed" && styles.toggleBtnTextActive]}>
                                                Fixed
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.label}>{charge.type === "percent" ? "Charge Percent" : "Fixed Amount"}</Text>
                                    <TextInput
                                        value={charge.value}
                                        onChangeText={(text) => updateCharge(index, "value", text)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        style={styles.input}
                                    />

                                    <View style={styles.chargeAmountRow}>
                                        <Text style={styles.chargeAmountLabel}>Charge Amount</Text>
                                        <Text style={styles.chargeAmountValue}>{calculateChargeAmount(charge).toFixed(2)}</Text>
                                    </View>

                                    {charges.length > 1 && (
                                        <TouchableOpacity style={styles.removeButton} onPress={() => removeCharge(index)}>
                                            <Text style={styles.removeButtonText}>Remove Charge</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            <TouchableOpacity style={styles.outlineButton} onPress={addCharge}>
                                <Text style={styles.outlineButtonText}>+ Add More Charge</Text>
                            </TouchableOpacity>

                            <View style={styles.summaryBox}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Charges</Text>
                                    <Text style={styles.summaryValue}>{totalCharges.toFixed(2)}</Text>
                                </View>
                                <View style={[styles.summaryRow, { marginTop: 6 }]}>
                                    <Text style={[styles.summaryLabel, { color: "#0A8F3C" }]}>Receivable Amount</Text>
                                    <Text style={[styles.summaryValue, { color: "#0A8F3C" }]}>{receivableAmount.toFixed(2)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.primaryButton} onPress={createBill}>
                                <Text style={styles.primaryButtonText}>Save Bill</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowBillForm(false)}>
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ) : null}

            {/* ── Round Bill (view) ── */}
            {round.bill && round.bill.id ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Round Bill</Text>
                    <View style={styles.card}>
                        <Info icon="🏆" label="Winning Amount" value={round.bill.winning_amount} />
                        <Info icon="📊" label="Total Charges" value={round.bill.total_charges} />
                        <Info icon="💵" label="Receivable Amount" value={round.bill.receivable_amount} />

                        <View style={styles.divider} />
                        <Text style={styles.subHeading}>Charges</Text>

                        {round.bill.charges?.map((charge: any) => (
                            <View key={charge.id} style={styles.chargePillRow}>
                                <View style={styles.chargePill}>
                                    <Text style={styles.chargePillName}>{charge.charge_name}</Text>
                                    <Text style={styles.chargePillMeta}>
                                        {charge.charge_type} · {charge.charge_value}
                                    </Text>
                                </View>
                                <Text style={styles.chargePillAmount}>{charge.charge_amount}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            {/* ── Admin Bid ── */}
            {!isRoundOne && round.status === "open" ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Manual Admin Bid</Text>
                    <View style={styles.card}>
                        <Text style={styles.subHeading}>Eligible Members</Text>
                        {eligibleMembers.map((member) => (
                            <View key={member.group_member_id} style={styles.eligibleMemberRow}>
                                <View style={styles.memberAvatar}>
                                    <Text style={styles.memberAvatarText}>
                                        {(member.full_name || "?").charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.eligibleMemberText}>
                                    {member.full_name}
                                    <Text style={{ color: "#6B7280" }}> (ID: {member.group_member_id})</Text>
                                </Text>
                            </View>
                        ))}

                        <Text style={styles.label}>Group Member ID</Text>
                        <TextInput
                            value={selectedGroupMemberId}
                            onChangeText={setSelectedGroupMemberId}
                            keyboardType="numeric"
                            placeholder="Enter member ID"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Bid Amount</Text>
                        <TextInput
                            value={bidAmount}
                            onChangeText={setBidAmount}
                            keyboardType="numeric"
                            placeholder="Enter bid amount"
                            style={styles.input}
                        />

                        <TouchableOpacity style={styles.primaryButton} onPress={placeAdminBid}>
                            <Text style={styles.primaryButtonText}>Place Bid</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {/* ── Close Round ── */}
            {round.status === "open" ? (
                <TouchableOpacity style={styles.dangerButton} onPress={closeRound}>
                    <Text style={styles.dangerButtonText}>Close Round</Text>
                </TouchableOpacity>
            ) : null}

            {/* ── Contributions ── */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Contributions / Payments</Text>
            </View>

            {contributions.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No contributions yet.</Text>
                </View>
            ) : (
                contributions.map((item) => (
                    <View key={item.id} style={styles.contributionCard}>
                        <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>
                                {(item.full_name || "?").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.memberName}>{item.full_name}</Text>
                            <Text style={styles.memberInfo}>Amount: {item.amount}</Text>
                            <View style={[
                                styles.statusBadge,
                                item.status === "paid" && styles.statusBadgePaid,
                                { marginTop: 4 },
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    item.status === "paid" && styles.statusTextPaid,
                                ]}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.paymentActions}>
                            <TouchableOpacity
                                style={styles.paidButton}
                                onPress={() => togglePayment(item.id, "paid")}
                            >
                                <Text style={styles.paidButtonText}>Paid</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dueButton}
                                onPress={() => togglePayment(item.id, "due")}
                            >
                                <Text style={styles.dueButtonText}>Due</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}

            {/* ── Bids ── */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Bids</Text>

            {bids.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No bids placed yet.</Text>
                </View>
            ) : (
                bids.map((bid) => (
                    <View key={bid.id} style={styles.bidCard}>
                        <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>
                                {(bid.full_name || "?").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.memberName}>{bid.full_name}</Text>
                            <Text style={styles.memberInfo}>Bid Amount: {bid.bid_amount}</Text>
                            <Text style={styles.memberInfo}>Date: {bid.created_at}</Text>
                        </View>
                        <View style={styles.bidAmountBadge}>
                            <Text style={styles.bidAmountText}>{bid.bid_amount}</Text>
                        </View>
                    </View>
                ))
            )}

            <View style={{ height: 32 }} />
        </ScrollView>
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

    // Round card
    roundCard: {
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
    roundTitle: { fontSize: 23, fontWeight: "900", color: "#111827" },
    statusBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#E7F8EF",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        marginTop: 6,
    },
    statusBadgeClosed: { backgroundColor: "#FEF3C7" },
    statusBadgePaid: { backgroundColor: "#E7F8EF" },
    statusText: { color: "#0A8F3C", fontWeight: "800", textTransform: "capitalize" },
    statusTextClosed: { color: "#B45309" },
    statusTextPaid: { color: "#0A8F3C" },

    infoGrid: { gap: 12 },
    infoItem: { flexDirection: "row", alignItems: "center", gap: 10 },
    infoIcon: { fontSize: 18 },
    infoLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
    infoValue: { fontSize: 16, color: "#111827", fontWeight: "800" },

    // Sections
    section: { marginBottom: 16 },
    sectionHeader: { marginBottom: 12 },
    sectionTitle: { fontSize: 21, fontWeight: "900", color: "#111827", marginBottom: 12 },
    subHeading: { fontSize: 15, fontWeight: "800", color: "#374151", marginBottom: 10 },
    divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 12 },

    // Generic card
    card: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 16,
        elevation: 3,
        gap: 10,
    },

    // Buttons
    primaryButton: {
        height: 56,
        backgroundColor: "#1E63F3",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 0,
    },
    primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
    secondaryButton: {
        height: 52,
        backgroundColor: "#E5E7EB",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonText: { color: "#111827", fontSize: 15, fontWeight: "900" },
    outlineButton: {
        height: 50,
        borderWidth: 2,
        borderColor: "#1E63F3",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    outlineButtonText: { color: "#1E63F3", fontSize: 15, fontWeight: "900" },
    dangerButton: {
        height: 56,
        backgroundColor: "#FEE2E2",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    dangerButtonText: { color: "#DC2626", fontSize: 16, fontWeight: "900" },

    // Form
    label: { fontWeight: "800", color: "#111827", marginBottom: 6, marginTop: 2 },
    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#F9FAFB",
        borderRadius: 14,
        padding: 13,
        marginBottom: 4,
        fontSize: 16,
    },
    toggleRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
    toggleBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
    },
    toggleBtnActive: { backgroundColor: "#1E63F3" },
    toggleBtnText: { fontWeight: "800", color: "#374151" },
    toggleBtnTextActive: { color: "#fff" },

    chargeBox: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 16,
        padding: 14,
        gap: 4,
    },
    chargeAmountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#F3F4F6",
        padding: 10,
        borderRadius: 10,
        marginTop: 4,
    },
    chargeAmountLabel: { fontSize: 14, color: "#6B7280", fontWeight: "700" },
    chargeAmountValue: { fontSize: 14, color: "#111827", fontWeight: "900" },
    removeButton: {
        backgroundColor: "#FEE2E2",
        padding: 10,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 6,
    },
    removeButtonText: { color: "#DC2626", fontWeight: "800" },

    summaryBox: {
        backgroundColor: "#F0F4FF",
        borderRadius: 14,
        padding: 14,
        marginTop: 4,
    },
    summaryRow: { flexDirection: "row", justifyContent: "space-between" },
    summaryLabel: { fontSize: 15, fontWeight: "800", color: "#374151" },
    summaryValue: { fontSize: 15, fontWeight: "900", color: "#111827" },

    // Bill charges view
    chargePillRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    chargePill: { flex: 1 },
    chargePillName: { fontSize: 15, fontWeight: "800", color: "#111827" },
    chargePillMeta: { fontSize: 13, color: "#6B7280", marginTop: 2 },
    chargePillAmount: { fontSize: 16, fontWeight: "900", color: "#1E63F3" },

    // Eligible members
    eligibleMemberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },
    eligibleMemberText: { fontSize: 15, fontWeight: "700", color: "#111827" },

    // Member / contribution cards
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

    contributionCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
    },
    paymentActions: { flexDirection: "column", gap: 6 },
    paidButton: {
        backgroundColor: "#E7F8EF",
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    paidButtonText: { color: "#0A8F3C", fontWeight: "900", fontSize: 13 },
    dueButton: {
        backgroundColor: "#FEF3C7",
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    dueButtonText: { color: "#B45309", fontWeight: "900", fontSize: 13 },

    bidCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
    },
    bidAmountBadge: {
        backgroundColor: "#E8EFFF",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 14,
    },
    bidAmountText: { color: "#1E63F3", fontWeight: "900", fontSize: 14 },

    emptyCard: { backgroundColor: "#fff", padding: 18, borderRadius: 18, marginBottom: 14 },
    emptyText: { color: "#6B7280", fontWeight: "700" },
});
