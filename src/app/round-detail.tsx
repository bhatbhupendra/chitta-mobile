import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import AppInput from "../components/AppInput";

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

        if (charge.type === "percent") {
            return (winningAmount * value) / 100;
        }

        return value;
    };

    const totalCharges = charges.reduce((sum, charge) => {
        return sum + calculateChargeAmount(charge);
    }, 0);

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

            {round.status === "closed" && !round.bill ? (
                <AppCard>
                    <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 10 }}>
                        Bill
                    </Text>

                    {!showBillForm ? (
                        <AppButton
                            title="Create Bill"
                            onPress={() => setShowBillForm(true)}
                        />
                    ) : (
                        <>
                            <Text>Winning Amount: {getWinningAmount().toFixed(2)}</Text>

                            {charges.map((charge, index) => (
                                <View
                                    key={index}
                                    style={{
                                        marginTop: 12,
                                        padding: 10,
                                        borderWidth: 1,
                                        borderColor: "#ddd",
                                        borderRadius: 8,
                                    }}
                                >
                                    <AppInput
                                        label="Charge Name"
                                        value={charge.name}
                                        onChangeText={(text: string) =>
                                            updateCharge(index, "name", text)
                                        }
                                    />

                                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                                        Charge Type
                                    </Text>

                                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                                        <TouchableOpacity
                                            onPress={() => updateCharge(index, "type", "percent")}
                                            style={{
                                                flex: 1,
                                                padding: 10,
                                                borderRadius: 8,
                                                backgroundColor:
                                                    charge.type === "percent" ? "#0d6efd" : "#6c757d",
                                            }}
                                        >
                                            <Text style={{ color: "#fff", textAlign: "center" }}>
                                                Percent
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => updateCharge(index, "type", "fixed")}
                                            style={{
                                                flex: 1,
                                                padding: 10,
                                                borderRadius: 8,
                                                backgroundColor:
                                                    charge.type === "fixed" ? "#0d6efd" : "#6c757d",
                                            }}
                                        >
                                            <Text style={{ color: "#fff", textAlign: "center" }}>
                                                Fixed
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <AppInput
                                        label={
                                            charge.type === "percent"
                                                ? "Charge Percent"
                                                : "Fixed Amount"
                                        }
                                        value={charge.value}
                                        onChangeText={(text: string) =>
                                            updateCharge(index, "value", text)
                                        }
                                        keyboardType="numeric"
                                    />

                                    <Text>
                                        Charge Amount: {calculateChargeAmount(charge).toFixed(2)}
                                    </Text>

                                    {charges.length > 1 ? (
                                        <AppButton
                                            title="Remove Charge"
                                            variant="secondary"
                                            onPress={() => removeCharge(index)}
                                        />
                                    ) : null}
                                </View>
                            ))}

                            <AppButton title="Add More Charge" onPress={addCharge} />

                            <View style={{ marginTop: 10 }}>
                                <Text style={{ fontWeight: "800" }}>
                                    Total Charges: {totalCharges.toFixed(2)}
                                </Text>
                                <Text style={{ fontWeight: "800" }}>
                                    Receivable Amount: {receivableAmount.toFixed(2)}
                                </Text>
                            </View>

                            <AppButton title="Save Bill" onPress={createBill} />

                            <AppButton
                                title="Cancel"
                                variant="secondary"
                                onPress={() => setShowBillForm(false)}
                            />
                        </>
                    )}
                </AppCard>
            ) : null}

            {round.bill && round.bill.id ? (
                <AppCard>
                    <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 10 }}>
                        Round Bill
                    </Text>

                    <Text>Winning Amount: {round.bill.winning_amount}</Text>
                    <Text>Total Charges: {round.bill.total_charges}</Text>
                    <Text>Receivable Amount: {round.bill.receivable_amount}</Text>

                    <Text style={{ fontWeight: "800", marginTop: 10 }}>Charges</Text>

                    {round.bill.charges?.map((charge: any) => (
                        <View key={charge.id} style={{ marginTop: 6 }}>
                            <Text>{charge.charge_name}</Text>
                            <Text>
                                Type: {charge.charge_type} | Value: {charge.charge_value}
                            </Text>
                            <Text>Amount: {charge.charge_amount}</Text>
                        </View>
                    ))}
                </AppCard>
            ) : null}

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

                    <AppButton
                        title="Mark Paid"
                        onPress={() => togglePayment(item.id, "paid")}
                    />

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