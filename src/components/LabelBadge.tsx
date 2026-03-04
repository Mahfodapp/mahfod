import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { MemoLabel } from '../store/useMemoStore';

interface LabelBadgeProps {
    label: MemoLabel;
    small?: boolean;
}

export function LabelBadge({ label, small }: LabelBadgeProps) {
    const bg = colors.labels[label] || colors.labels['أخرى'];
    return (
        <View style={[styles.badge, { backgroundColor: bg + '33' }, small && styles.small]}>
            <Text style={[styles.text, { color: bg }, small && styles.smallText]}>{label}</Text>
        </View>
    );
}

interface Props {
    selected: MemoLabel;
    onSelect: (l: MemoLabel) => void;
}

const LABELS: MemoLabel[] = ['متن', 'شعر', 'حديث', 'فقه', 'عقيدة', 'أخرى'];

export function LabelSelector({ selected, onSelect }: Props) {
    return (
        <View style={styles.row}>
            {LABELS.map(l => (
                <TouchableOpacity
                    key={l}
                    onPress={() => onSelect(l)}
                    style={[
                        styles.chip,
                        { borderColor: colors.labels[l] },
                        selected === l && { backgroundColor: colors.labels[l] + '44' },
                    ]}
                >
                    <Text style={[styles.chipText, { color: colors.labels[l] }]}>{l}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    small: { paddingHorizontal: 6, paddingVertical: 2 },
    text: { fontSize: 13, fontWeight: '700' },
    smallText: { fontSize: 11 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    chipText: { fontSize: 13, fontWeight: '700' },
});
