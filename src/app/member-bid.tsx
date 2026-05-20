import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
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

        return Math.min(
            ...group.bids.map((bid: any) => Number(bid.bid_amount))
        );
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
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 8 }}>
                Member Self Bid
            </Text>

            <Text style={{ color: "#666", marginBottom: 14 }}>
                Enter your member code to see your groups and place a bid.
            </Text>

            <AppInput
                label="Member Code"
                value={memberCode}
                onChangeText={setMemberCode}
                placeholder="Example: RAM12345678"
            />

            <AppButton title="Search" onPress={lookupMember} loading={loading} />

            {member ? (
                <AppCard>
                    <Text style={{ fontSize: 18, fontWeight: "800" }}>
                        {member.full_name}
                    </Text>
                    <Text>Code: {member.member_code}</Text>
                </AppCard>
            ) : null}

            {groups.map((group) => {
                const isSelected = selectedGroup?.group_id === group.group_id;

                return (
                    <TouchableOpacity
                        key={group.group_id}
                        onPress={() => {
                            setSelectedGroup(group);
                            setBidAmount("");
                        }}
                    >
                        <AppCard>
                            <Text style={{ fontSize: 18, fontWeight: "800" }}>
                                {group.group_name}
                            </Text>

                            <Text>Fund Amount: {group.fund_amount}</Text>

                            <Text>
                                Open Round:{" "}
                                {group.open_round ? group.open_round.round_no : "No open round"}
                            </Text>

                            <Text>
                                Max Bid:{" "}
                                {group.open_round ? group.open_round.max_bid_amount : "-"}
                            </Text>

                            <Text>Eligible Raw: {String(group.eligible)}</Text>
                            <Text>Eligible: {group.eligible === true ? "Yes" : "No"}</Text>

                            {/* Put these here for debugging */}
                            <Text>Already Paid: {group.already_paid ? "Yes" : "No"}</Text>
                            <Text>Already Bid: {group.already_bid ? "Yes" : "No"}</Text>
                            <Text>Reason: {group.not_eligible_reason || "-"}</Text>

                            <Text style={{ fontWeight: "800", marginTop: 10 }}>
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
                                                marginTop: 8,
                                                paddingBottom: 8,
                                                borderBottomWidth: 1,
                                                borderBottomColor: "#e5e5e5",
                                            }}
                                        >
                                            <Text style={{ fontWeight: "700" }}>
                                                #{index + 1} {bid.full_name}
                                            </Text>
                                            <Text>Bid Amount: {bid.bid_amount}</Text>
                                            <Text>Date: {bid.created_at}</Text>
                                        </View>
                                    ))
                            ) : (
                                <Text>No bid history yet.</Text>
                            )}

                            {isSelected ? (
                                <Text
                                    style={{
                                        color: "#0d6efd",
                                        fontWeight: "800",
                                        marginTop: 6,
                                    }}
                                >
                                    Selected
                                </Text>
                            ) : null}
                        </AppCard>
                    </TouchableOpacity>
                );
            })}

            {selectedGroup ? (
                <>
                    <AppCard>
                        <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8 }}>
                            Current Lowest Bid
                        </Text>

                        {getLowestBid(selectedGroup) !== null ? (
                            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0d6efd" }}>
                                {getLowestBid(selectedGroup)}
                            </Text>
                        ) : (
                            <Text>No bids placed yet.</Text>
                        )}
                    </AppCard>
                    <AppCard>
                        <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8 }}>
                            Place Bid
                        </Text>

                        {!selectedGroup.open_round ? (
                            <Text style={{ color: "red", marginBottom: 10 }}>
                                No open round is available for this group.
                            </Text>
                        ) : !selectedGroup.eligible ? (
                            <Text style={{ color: "red", marginBottom: 10 }}>
                                You are not eligible to bid in this round.
                            </Text>
                        ) : (
                            <>
                                <Text style={{ fontWeight: "700", marginBottom: 8 }}>
                                    Select Bid Amount
                                </Text>

                                {[1000, 2000, 5000, 10000].map((minusAmount) => {
                                    const baseAmount = getBaseBidAmount(selectedGroup);
                                    const finalAmount = baseAmount - minusAmount;

                                    return (
                                        <TouchableOpacity
                                            key={minusAmount}
                                            onPress={() => selectBidAmount(minusAmount)}
                                            style={{
                                                backgroundColor: bidAmount === String(finalAmount) ? "#0d6efd" : "#f1f1f1",
                                                padding: 14,
                                                borderRadius: 10,
                                                marginBottom: 10,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontWeight: "800",
                                                    color: bidAmount === String(finalAmount) ? "#fff" : "#000",
                                                    textAlign: "center",
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
                    </AppCard>
                </>
            ) : null}
        </ScrollView>
    );
}