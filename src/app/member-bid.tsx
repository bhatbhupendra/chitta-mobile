import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";

export default function MemberBidScreen() {
    const [memberCode, setMemberCode] = useState("");
    const [member, setMember] = useState<any>(null);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const lookupMember = async () => {
        if (!memberCode.trim()) {
            Alert.alert("Validation", "Please enter member code");
            return;
        }

        try {
            setLoading(true);

            const response = await apiClient.post("/member_code_lookup.php", {
                member_code: memberCode.trim(),
            });

            console.log("MEMBER LOOKUP RESPONSE:", response.data);

            if (response.data.success) {
                setMember(response.data.data.member);
                setGroups(response.data.data.groups || []);
                setSelectedGroup(null);
                setBidAmount("");
            } else {
                Alert.alert("Error", response.data.message || "Member not found");
            }
        } catch (error: any) {
            console.log("LOOKUP ERROR:", error?.response?.data || error.message);
            Alert.alert("Error", "Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    const getLowestBid = (group: any) => {
        if (!group?.bids || group.bids.length === 0) return null;

        return Math.min(...group.bids.map((bid: any) => Number(bid.bid_amount)));
    };

    const getBaseBidAmount = (group: any) => {
        const lowestBid = getLowestBid(group);

        if (lowestBid !== null) {
            return lowestBid;
        }

        return Number(group?.open_round?.max_bid_amount || 0);
    };

    const selectBidAmount = (minusAmount: number) => {
        if (!selectedGroup) return;

        const baseAmount = getBaseBidAmount(selectedGroup);
        const finalAmount = baseAmount - minusAmount;

        if (finalAmount <= 0) {
            Alert.alert("Validation", "Bid amount is invalid.");
            return;
        }

        setBidAmount(String(finalAmount));
    };

    const placeBid = async () => {
        if (!selectedGroup) {
            Alert.alert("Validation", "Please select a group");
            return;
        }

        if (!selectedGroup.open_round) {
            Alert.alert("Validation", "No open round available for this group");
            return;
        }

        if (!selectedGroup.eligible) {
            Alert.alert("Not Eligible", "You are not eligible to bid in this round.");
            return;
        }

        if (!bidAmount.trim()) {
            Alert.alert("Validation", "Please enter bid amount");
            return;
        }

        const amount = Number(bidAmount);

        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Validation", "Please enter a valid bid amount");
            return;
        }

        const maxBid = Number(selectedGroup.open_round.max_bid_amount);

        if (amount > maxBid) {
            Alert.alert("Validation", `Bid amount cannot be greater than ${maxBid}`);
            return;
        }

        const lowestBid = getLowestBid(selectedGroup);

        if (lowestBid !== null && amount >= lowestBid) {
            Alert.alert(
                "Validation",
                `Your bid must be lower than the current lowest bid: ${lowestBid}`
            );
            return;
        }

        try {
            setLoading(true);

            const response = await apiClient.post("/member_self_bid.php", {
                member_code: memberCode.trim(),
                group_id: selectedGroup.group_id,
                bid_amount: amount,
            });

            if (response.data.success) {
                Alert.alert("Success", "Your bid has been placed successfully");
                setBidAmount("");
                lookupMember();
            } else {
                Alert.alert("Error", response.data.message || "Bid failed");
            }
        } catch (error: any) {
            console.log("BID ERROR:", error?.response?.data || error.message);
            Alert.alert(
                "Error",
                error?.response?.data?.message || "Could not connect to server"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "#f4f6fb" }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
            <View
                style={{
                    backgroundColor: "#111827",
                    borderRadius: 24,
                    padding: 20,
                    marginBottom: 16,
                }}
            >
                <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }}>
                    Member Self Bid
                </Text>
                <Text style={{ color: "#cbd5e1", marginTop: 6, lineHeight: 20 }}>
                    Enter your member code, select your group, and place your lowest bid.
                </Text>
            </View>

            <View
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                }}
            >
                <AppInput
                    label="Member Code"
                    value={memberCode}
                    onChangeText={setMemberCode}
                    placeholder="Example: RAM12345678"
                />

                <AppButton title="Search" onPress={lookupMember} loading={loading} />
            </View>

            {member ? (
                <View
                    style={{
                        backgroundColor: "#ecfdf5",
                        borderRadius: 18,
                        padding: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: "#bbf7d0",
                    }}
                >
                    <Text style={{ fontSize: 13, color: "#047857", fontWeight: "800" }}>
                        MEMBER FOUND
                    </Text>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#064e3b", marginTop: 4 }}>
                        {member.full_name}
                    </Text>
                    <Text style={{ color: "#065f46", marginTop: 4 }}>
                        Code: {member.member_code}
                    </Text>
                </View>
            ) : null}

            {groups.map((group) => {
                const isSelected = selectedGroup?.group_id === group.group_id;
                const lowestBid = getLowestBid(group);

                return (
                    <TouchableOpacity
                        key={group.group_id}
                        activeOpacity={0.85}
                        onPress={() => {
                            setSelectedGroup(group);
                            setBidAmount("");
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: "#fff",
                                borderRadius: 22,
                                padding: 16,
                                marginBottom: 14,
                                borderWidth: isSelected ? 2 : 1,
                                borderColor: isSelected ? "#2563eb" : "#e5e7eb",
                                shadowColor: "#000",
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                elevation: 2,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#111827" }}>
                                        {group.group_name}
                                    </Text>
                                    <Text style={{ color: "#6b7280", marginTop: 3 }}>
                                        Fund Amount: {group.fund_amount}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        backgroundColor: group.eligible ? "#dcfce7" : "#fee2e2",
                                        paddingHorizontal: 10,
                                        paddingVertical: 6,
                                        borderRadius: 999,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: group.eligible ? "#166534" : "#991b1b",
                                            fontWeight: "900",
                                            fontSize: 12,
                                        }}
                                    >
                                        {group.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#f8fafc",
                                        borderRadius: 14,
                                        padding: 12,
                                    }}
                                >
                                    <Text style={{ color: "#64748b", fontSize: 12 }}>Open Round</Text>
                                    <Text style={{ fontWeight: "900", fontSize: 16, marginTop: 2 }}>
                                        {group.open_round ? group.open_round.round_no : "-"}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#f8fafc",
                                        borderRadius: 14,
                                        padding: 12,
                                    }}
                                >
                                    <Text style={{ color: "#64748b", fontSize: 12 }}>Max Bid</Text>
                                    <Text style={{ fontWeight: "900", fontSize: 16, marginTop: 2 }}>
                                        {group.open_round ? group.open_round.max_bid_amount : "-"}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#f8fafc",
                                        borderRadius: 14,
                                        padding: 12,
                                    }}
                                >
                                    <Text style={{ color: "#64748b", fontSize: 12 }}>Lowest</Text>
                                    <Text style={{ fontWeight: "900", fontSize: 16, marginTop: 2 }}>
                                        {lowestBid !== null ? lowestBid : "-"}
                                    </Text>
                                </View>
                            </View>

                            {group.not_eligible_reason ? (
                                <Text style={{ color: "#dc2626", fontWeight: "700", marginBottom: 10 }}>
                                    Reason: {group.not_eligible_reason}
                                </Text>
                            ) : null}

                            <Text style={{ fontWeight: "900", fontSize: 16, marginBottom: 8 }}>
                                Bid History
                            </Text>

                            {group.bids && group.bids.length > 0 ? (
                                [...group.bids]
                                    .sort(
                                        (a: any, b: any) =>
                                            new Date(a.created_at).getTime() -
                                            new Date(b.created_at).getTime()
                                    )
                                    .map((bid: any, index: number) => (
                                        <View
                                            key={index}
                                            style={{
                                                backgroundColor: "#f9fafb",
                                                borderRadius: 14,
                                                padding: 12,
                                                marginBottom: 8,
                                                borderWidth: 1,
                                                borderColor: "#eef2f7",
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <Text style={{ fontWeight: "900", color: "#111827" }}>
                                                    #{index + 1} {bid.full_name}
                                                </Text>
                                                <Text style={{ fontWeight: "900", color: "#2563eb" }}>
                                                    {bid.bid_amount}
                                                </Text>
                                            </View>
                                            <Text style={{ color: "#6b7280", marginTop: 4 }}>
                                                {bid.created_at}
                                            </Text>
                                        </View>
                                    ))
                            ) : (
                                <Text style={{ color: "#6b7280" }}>No bid history yet.</Text>
                            )}

                            {isSelected ? (
                                <View
                                    style={{
                                        marginTop: 10,
                                        backgroundColor: "#dbeafe",
                                        borderRadius: 14,
                                        padding: 10,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#1d4ed8",
                                            fontWeight: "900",
                                            textAlign: "center",
                                        }}
                                    >
                                        Selected Group
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                );
            })}

            {selectedGroup ? (
                <>
                    <View
                        style={{
                            backgroundColor: "#111827",
                            borderRadius: 22,
                            padding: 18,
                            marginTop: 4,
                            marginBottom: 14,
                        }}
                    >
                        <Text style={{ color: "#cbd5e1", fontWeight: "700" }}>
                            Current Lowest Bid
                        </Text>

                        <Text style={{ color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 4 }}>
                            {getLowestBid(selectedGroup) !== null
                                ? getLowestBid(selectedGroup)
                                : "No bids yet"}
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 22,
                            padding: 16,
                            shadowColor: "#000",
                            shadowOpacity: 0.06,
                            shadowRadius: 12,
                            elevation: 3,
                        }}
                    >
                        <Text style={{ fontSize: 20, fontWeight: "900", marginBottom: 12 }}>
                            Place Bid
                        </Text>

                        {!selectedGroup.open_round ? (
                            <Text style={{ color: "#dc2626", fontWeight: "700" }}>
                                No open round is available for this group.
                            </Text>
                        ) : !selectedGroup.eligible ? (
                            <Text style={{ color: "#dc2626", fontWeight: "700" }}>
                                You are not eligible to bid in this round.
                            </Text>
                        ) : (
                            <>
                                <Text style={{ color: "#6b7280", marginBottom: 10 }}>
                                    Choose how much lower you want to bid from the current base amount.
                                </Text>

                                {[1000, 2000, 5000, 10000].map((minusAmount) => {
                                    const baseAmount = getBaseBidAmount(selectedGroup);
                                    const finalAmount = baseAmount - minusAmount;
                                    const active = bidAmount === String(finalAmount);

                                    return (
                                        <TouchableOpacity
                                            key={minusAmount}
                                            activeOpacity={0.85}
                                            onPress={() => selectBidAmount(minusAmount)}
                                            style={{
                                                backgroundColor: active ? "#2563eb" : "#f1f5f9",
                                                padding: 15,
                                                borderRadius: 16,
                                                marginBottom: 10,
                                                borderWidth: 1,
                                                borderColor: active ? "#2563eb" : "#e2e8f0",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontWeight: "900",
                                                    color: active ? "#fff" : "#111827",
                                                    textAlign: "center",
                                                    fontSize: 16,
                                                }}
                                            >
                                                -{minusAmount} = {finalAmount}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                <AppButton
                                    title={bidAmount ? `Submit Bid ${bidAmount}` : "Select Bid Amount"}
                                    onPress={placeBid}
                                    loading={loading}
                                />
                            </>
                        )}
                    </View>
                </>
            ) : null}
        </ScrollView>
    );
}