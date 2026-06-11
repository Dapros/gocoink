import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { COLORS } from '@/constants/theme'

interface ButtonProps {
  label: string;
  onPress: () => void
  variant?: 'primary' | 'danger' | 'outline'
  isLoading?: boolean
}

export const Button = ({ label, onPress, variant = 'primary', isLoading }: ButtonProps) => {
  const getBgColor = () => {
    if (variant === 'primary') return COLORS.primary
    if (variant === 'danger') return COLORS.danger
    return 'transparent'
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
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
          color: COLORS.text,
          fontSize: 16,
          fontWeight: '600'
        }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
