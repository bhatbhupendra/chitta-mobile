import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";

export default function RoundDetailScreen() {
    const { roundId } = useLocalSearchParams();

    const [round, setRound] = useState<any>(null);
    const [contributions, setContributions] = useState<any[]>([]);
    const [bids, setBids] = useState<any[]>([]);
    const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
    const [selectedGroupMemberId, setSelectedGroupMemberId] = useState("");
    const [bidAmount, setBidAmount] = useState("");
    const [loading, setLoading] = useState(false);

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

    if (!round) {
        return (
            <View style={{ flex: 1, padding: 16 }}>
                <Text>{loading ? "Loading..." : "Round not found"}</Text>
            </View>
        );
    }

    const isRoundOne = Number(round.round_no) === 1;

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <AppCard>
                <Text style={{ fontSize: 22, fontWeight: "800" }}>
                    Round {round.round_no}
                </Text>
                <Text>Status: {round.status}</Text>
                <Text>Fund Amount: {round.fund_amount}</Text>
                <Text>Max Allowed Bid: {round.max_bid_amount}</Text>
                <Text>Each Member Pays: {round.member_pay_amount}</Text>
                <Text>Winning Bid: {round.winning_bid || "-"}</Text>
                <Text>Payout To: {round.payout_to}</Text>
            </AppCard>

            {!isRoundOne && round.status === "open" ? (
                <AppCard>
                    <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8 }}>
                        Manual Admin Bid
                    </Text>

                    <Text style={{ marginBottom: 8 }}>Eligible Members:</Text>

                    {eligibleMembers.map((member) => (
                        <Text key={member.group_member_id}>
                            {member.group_member_id} - {member.full_name}
                        </Text>
                    ))}

                    <AppInput
                        label="Group Member ID"
                        value={selectedGroupMemberId}
                        onChangeText={setSelectedGroupMemberId}
                        keyboardType="numeric"
                    />

                    <AppInput
                        label="Bid Amount"
                        value={bidAmount}
                        onChangeText={setBidAmount}
                        keyboardType="numeric"
                    />

                    <AppButton title="Place Bid" onPress={placeAdminBid} />
                </AppCard>
            ) : null}

            {round.status === "open" ? (
                <AppButton title="Close Round" onPress={closeRound} />
            ) : null}

            <Text style={{ fontSize: 18, fontWeight: "800", marginVertical: 10 }}>
                Contributions / Payments
            </Text>

            {contributions.map((item) => (
                <AppCard key={item.id}>
                    <Text style={{ fontWeight: "800" }}>{item.full_name}</Text>
                    <Text>Amount: {item.amount}</Text>
                    <Text>Status: {item.status}</Text>

                    <AppButton title="Mark Paid" onPress={() => togglePayment(item.id, "paid")} />

                    <AppButton
                        title="Mark Due"
                        variant="secondary"
                        onPress={() => togglePayment(item.id, "due")}
                    />
                </AppCard>
            ))}

            <Text style={{ fontSize: 18, fontWeight: "800", marginVertical: 10 }}>
                Bids
            </Text>

            {bids.map((bid) => (
                <AppCard key={bid.id}>
                    <Text style={{ fontWeight: "800" }}>{bid.full_name}</Text>
                    <Text>Bid Amount: {bid.bid_amount}</Text>
                    <Text>Date: {bid.created_at}</Text>
                </AppCard>
            ))}
        </ScrollView>
    );
}