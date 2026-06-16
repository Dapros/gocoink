import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { COLORS } from '@/constants/theme'

interface ButtonProps {
  label: string;
  onPress: () => void
  variant?: 'primary' | 'danger' | 'outline'
  isLoading?: boolean
  disabled?: boolean
}

export const Button = ({ label, onPress, variant = 'primary', isLoading, disabled = false }: ButtonProps) => {
  const getBgColor = () => {
    if (variant === 'primary') return COLORS.primary
    if (variant === 'danger') return COLORS.danger
    return 'transparent'
  }

  const isDisabled = isLoading || disabled
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={{
        backgroundColor: getBgColor(),
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: variant === 'outline' ? COLORS.border : 'transparent',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.text} />
      ) : (
        <Text style={{
          color: disabled && variant === 'outline' ? COLORS.textMuted : COLORS.text,
          fontSize: 16,
          fontWeight: '600'
        }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
