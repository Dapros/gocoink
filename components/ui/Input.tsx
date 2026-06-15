import React from 'react'
import { View, Text, TextInput, TextInputProps } from 'react-native'
import { COLORS } from '@/constants/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export const Input = ({ label, error, ...props }: InputProps) => {
  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: 14 }}>
          {label}
        </Text>
      )}
      <TextInput 
        placeholderTextColor={COLORS.textMuted}
        style={{
          backgroundColor: COLORS.surfaceLight,
          color: COLORS.text,
          padding: 16,
          borderRadius: 12,
          fontSize: 16,
          borderWidth: 1,
          borderColor: error ? COLORS.danger : 'transparent',
        }}
        {...props}
      />
      {error && (
        <Text style={{ color: COLORS.danger, marginTop: 4, fontSize: 12 }}>
          {error}
        </Text>
      )}
    </View>
  )
}
