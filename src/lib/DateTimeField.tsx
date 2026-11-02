import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { C, FIELD, MIN_TAP, PRESSED } from './theme';
import { Label } from './ui';
import { fmtShort, fmtTime, toDateStr, toTimeStr } from './date';

type Mode = 'date' | 'time' | 'datetime';
type Props = { label: string; mode: Mode; value: Date | null; onChange: (d: Date) => void; placeholder?: string; error?: string };

const merge = (day: Date, time: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes());

export function DateTimeField({ label, mode, value, onChange, placeholder, error }: Props) {
  const [open, setOpen] = useState(false); // iOS inline spinner

  const text = !value
    ? placeholder ?? (mode === 'time' ? 'Select time' : 'Select date')
    : mode === 'time' ? fmtTime(toTimeStr(value))
    : mode === 'date' ? fmtShort(toDateStr(value))
    : `${fmtShort(toDateStr(value))} · ${fmtTime(toTimeStr(value))}`;

  const press = () => {
    if (Platform.OS !== 'android') return setOpen((o) => !o);
    const start = value ?? new Date();
    DateTimePickerAndroid.open({
      value: start, mode: mode === 'time' ? 'time' : 'date', is24Hour: false,
      onChange: (e, d) => {
        if (e.type !== 'set' || !d) return;
        if (mode !== 'datetime') return onChange(d);
        DateTimePickerAndroid.open({
          value: d, mode: 'time', is24Hour: false,
          onChange: (e2, d2) => { if (e2.type === 'set' && d2) onChange(merge(d, d2)); },
        });
      },
    });
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <Pressable
        accessibilityRole="button" accessibilityLabel={`${label}: ${text}`} onPress={press}
        style={({ pressed }) => [{ ...FIELD, borderColor: error ? C.danger : C.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pressed && PRESSED]}
      >
        <Text style={{ fontSize: 16, color: value ? C.text : C.muted }}>{text}</Text>
        <Ionicons name={mode === 'time' ? 'time-outline' : 'calendar-outline'} size={20} color={C.muted} />
      </Pressable>
      {error ? <Text style={{ color: C.danger, marginTop: 8 }}>{error}</Text> : null}
      {Platform.OS === 'ios' && open ? (
        <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: C.border, marginTop: 8 }}>
          <DateTimePicker value={value ?? new Date()} mode={mode} display="spinner" onChange={(_, d) => d && onChange(d)} />
          <Pressable onPress={() => setOpen(false)} style={{ minHeight: MIN_TAP, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.navy2, fontWeight: '700' }}>Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
