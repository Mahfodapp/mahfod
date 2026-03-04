import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMemoStore, MemoLabel } from '../store/useMemoStore';
import { colors } from '../theme/colors';
import { LabelSelector } from '../components/LabelBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMemo'>;

export default function AddMemoScreen({ navigation }: Props) {
    const addMemo = useMemoStore(s => s.addMemo);
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [label, setLabel] = useState<MemoLabel>('متن');

    const handleSave = () => {
        if (!title.trim()) { Alert.alert('تنبيه', 'يرجى إدخال عنوان للمحفوظ'); return; }
        if (!text.trim()) { Alert.alert('تنبيه', 'يرجى إدخال نص المحفوظ'); return; }
        addMemo(title.trim(), text.trim(), label);
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                <Text style={styles.label}>العنوان</Text>
                <TextInput
                    style={styles.input}
                    placeholder="مثال: متن الآجرومية - باب الكلام"
                    placeholderTextColor={colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                    textAlign="right"
                />

                <Text style={styles.label}>التصنيف</Text>
                <LabelSelector selected={label} onSelect={setLabel} />

                <Text style={[styles.label, { marginTop: 20 }]}>النص</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="أدخل نص المتن أو الشعر أو الحديث هنا..."
                    placeholderTextColor={colors.textMuted}
                    value={text}
                    onChangeText={setText}
                    multiline
                    numberOfLines={8}
                    textAlign="right"
                    textAlignVertical="top"
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>حفظ وبدء الحفظ</Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    label: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6 },
    input: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        color: colors.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: { minHeight: 180, lineHeight: 26 },
    saveBtn: {
        backgroundColor: colors.accent,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 28,
    },
    saveBtnText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
});
