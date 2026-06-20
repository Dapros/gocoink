import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleProp, ViewStyle } from 'react-native'
import { COLORS } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'

interface ButtonProps {
  label?: string
  onPress: () => void
  variant?: 'primary' | 'danger' | 'outline' | 'fab' | 'icon'
  isLoading?: boolean
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  iconPos?: 'top' | 'bottom' | 'left' | 'right'
  iconColor?: string
  style?: StyleProp<ViewStyle>
}

export const Button = ({ 
  label, 
  onPress, 
  variant = 'primary', 
  isLoading, 
  disabled = false, 
  icon, 
  iconPos = 'left',
  iconColor,
  style 
}: ButtonProps) => {

  const getBgColor = () => {
    if (variant === 'primary') return COLORS.primary
    if (variant === 'danger') return COLORS.danger
    if (variant === 'fab') return COLORS.primary
    if (variant === 'icon') return COLORS.surfaceLight
    return 'transparent'
  }

  const isDisabled = isLoading || disabled
  const isVertical = iconPos === 'top' || iconPos === 'bottom'

  const getVariantStyles = (): ViewStyle => {
    if (variant === 'fab') {
      return {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      }
    }
    if (variant === 'icon') {
      return {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
      }
    }
    return {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      flexDirection: isVertical ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? COLORS.border : 'transparent',
    }
  }

  const resolveIconColor = () => {
    if (iconColor) return iconColor
    if (variant === 'primary' || variant === 'danger' || variant === 'fab') return COLORS.text
    if (variant === 'outline' && disabled) return COLORS.textMuted
    return COLORS.primary
  }

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color={variant === 'outline' || variant === 'icon' ? COLORS.primary : COLORS.text} />
    }

    const iconElement = icon ? (
      <Ionicons 
        name={icon} 
        size={variant === 'fab' ? 32 : 24} 
        color={resolveIconColor()} 
      />
    ) : null

    const textElement = label ? (
      <Text style={{
        color: disabled && variant === 'outline' ? COLORS.textMuted : COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: icon && iconPos === 'left' && !isVertical ? 8 : 0,
        marginRight: icon && iconPos === 'right' && !isVertical ? 8 : 0,
        marginTop: icon && iconPos === 'top' && isVertical ? 8 : 0,
        marginBottom: icon && iconPos === 'bottom' && isVertical ? 8 : 0,
      }}>
        {label}
      </Text>
    ) : null

    if (iconPos === 'right' || iconPos === 'bottom') {
      return (
        <>
          {textElement}
          {iconElement}
        </>
      )
    }

    return (
      <>
        {iconElement}
        {textElement}
      </>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          backgroundColor: getBgColor(),
          opacity: isDisabled ? 0.3 : (isLoading ? 0.7 : 1),
        },
        getVariantStyles(),
        style
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  )
}
