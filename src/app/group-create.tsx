import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
} from "react-native";
import { AxiosError } from "axios";

import apiClient from "../api/apiClient";

const Field = ({ label, value, onChangeText, keyboardType = "default", icon }: any) => (
    <View style={styles.fieldCard}>
        <View style={styles.labelRow}>
            <Text style={styles.fieldIcon}>{icon}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholderTextColor="#9CA3AF"
        />
    </View>
);

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
            Alert.alert("Validation", "Member count, duration months, and amount must be greater than 0");
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

            const response = await apiClient.post("/groups_create.php", payload);

            if (response.data.success) {
                Alert.alert("Success", "Group created successfully");
                router.replace("/groups");
            } else {
                Alert.alert("Error", response.data.message || "Failed to create group");
            }
        } catch (error) {
            const err = error as AxiosError<any>;
            Alert.alert("Error", err.response?.data?.message || err.message || "Could not connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoText}>
                    Chitta fund amount means total group fund amount, not per-member payment.
                </Text>
            </View>

            <View style={styles.formCard}>
                <Field label="Group Name" value={groupName} onChangeText={setGroupName} icon="👥" />

                <Field label="Currency" value={currency} onChangeText={setCurrency} icon="💱" />

                <Field
                    label="Member Count"
                    value={memberCount}
                    onChangeText={setMemberCount}
                    keyboardType="numeric"
                    icon="👤"
                />

                <Field
                    label="Duration Months"
                    value={durationMonths}
                    onChangeText={setDurationMonths}
                    keyboardType="numeric"
                    icon="📅"
                />

                <Field
                    label="Chitta Fund Amount"
                    value={monthlyAmount}
                    onChangeText={setMonthlyAmount}
                    keyboardType="numeric"
                    icon="💰"
                />

                <Field
                    label="Bid Step Percent"
                    value={bidStepPercent}
                    onChangeText={setBidStepPercent}
                    keyboardType="numeric"
                    icon="📈"
                />

                <Field label="Start Date YYYY-MM-DD" value={startDate} onChangeText={setStartDate} icon="🗓️" />
            </View>

            <TouchableOpacity
                style={[styles.createButton, loading && { opacity: 0.7 }]}
                onPress={createGroup}
                disabled={loading}
            >
                <Text style={styles.createButtonText}>
                    {loading ? "Creating..." : "Create Group"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F6FA",
    },
    content: {
        padding: 16,
        paddingBottom: 30,
    },
    infoBox: {
        backgroundColor: "#EAF1FF",
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        marginBottom: 16,
    },
    infoIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    infoText: {
        flex: 1,
        color: "#374151",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "600",
    },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 16,
        marginBottom: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    fieldCard: {
        marginBottom: 15,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    fieldIcon: {
        fontSize: 17,
        marginRight: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
    },
    input: {
        height: 52,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#111827",
        fontWeight: "600",
    },
    createButton: {
        height: 60,
        backgroundColor: "#1E63F3",
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#1E63F3",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "900",
    },
});