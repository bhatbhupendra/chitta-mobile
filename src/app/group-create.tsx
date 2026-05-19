import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { AxiosError } from "axios";

import apiClient from "../api/apiClient";
import AppButton from "../components/AppButton";
import AppInput from "../components/AppInput";

export default function GroupCreateScreen() {
    const [groupName, setGroupName] = useState("");
    const [currency, setCurrency] = useState("NPR");
    const [memberCount, setMemberCount] = useState("");
    const [durationMonths, setDurationMonths] = useState("");
    const [monthlyAmount, setMonthlyAmount] = useState("");
    const [bidStepPercent, setBidStepPercent] = useState("2");
    const [startDate, setStartDate] = useState("2026-05-17");
    const [loading, setLoading] = useState(false);

    const createGroup = async () => {
        console.log("Create button clicked");

        if (!groupName.trim() || !memberCount || !durationMonths || !monthlyAmount) {
            Alert.alert("Validation", "Please fill all required fields");
            return;
        }

        const members = Number(memberCount);
        const duration = Number(durationMonths);
        const amount = Number(monthlyAmount);
        const bidStep = Number(bidStepPercent);

        if (Number.isNaN(members) || Number.isNaN(duration) || Number.isNaN(amount)) {
            Alert.alert("Validation", "Please enter valid numbers");
            return;
        }

        if (members <= 0 || duration <= 0 || amount <= 0) {
            Alert.alert(
                "Validation",
                "Member count, duration months, and amount must be greater than 0"
            );
            return;
        }

        if (Number.isNaN(bidStep) || bidStep < 0 || bidStep > 100) {
            Alert.alert("Validation", "Bid step percent must be between 0 and 100");
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            Alert.alert("Validation", "Start date must be in YYYY-MM-DD format");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                group_name: groupName.trim(),
                currency: currency.trim() || "NPR",
                member_count: members,
                duration_months: duration,
                monthly_amount: amount,
                bid_step_percent: bidStep,
                start_date: startDate,
            };

            console.log("Sending payload:", payload);

            const response = await apiClient.post("/groups_create.php", payload);

            console.log("API response:", response.data);

            if (response.data.success) {
                Alert.alert("Success", "Group created successfully");
                router.back();
            } else {
                Alert.alert(
                    "Error",
                    response.data.message || "Failed to create group"
                );
            }
        } catch (error) {
            const err = error as AxiosError<any>;

            console.log("Create group error:", err.message);
            console.log("Server error:", err.response?.data);
            console.log("Status:", err.response?.status);

            Alert.alert(
                "Error",
                err.response?.data?.message ||
                err.message ||
                "Could not connect to server"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ marginBottom: 14, color: "#666" }}>
                Chitta fund amount means total group fund amount, not per-member
                payment.
            </Text>

            <AppInput
                label="Group Name"
                value={groupName}
                onChangeText={setGroupName}
            />

            <AppInput
                label="Currency"
                value={currency}
                onChangeText={setCurrency}
            />

            <AppInput
                label="Member Count"
                value={memberCount}
                onChangeText={setMemberCount}
                keyboardType="numeric"
            />

            <AppInput
                label="Duration Months"
                value={durationMonths}
                onChangeText={setDurationMonths}
                keyboardType="numeric"
            />

            <AppInput
                label="Chitta Fund Amount"
                value={monthlyAmount}
                onChangeText={setMonthlyAmount}
                keyboardType="numeric"
            />

            <AppInput
                label="Bid Step Percent"
                value={bidStepPercent}
                onChangeText={setBidStepPercent}
                keyboardType="numeric"
            />

            <AppInput
                label="Start Date YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
            />

            <AppButton
                title="Create Group"
                onPress={createGroup}
                loading={loading}
            />
        </ScrollView>
    );
}