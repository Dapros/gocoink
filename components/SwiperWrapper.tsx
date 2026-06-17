import React from 'react'
import { View } from 'react-native'
import { FlingGestureHandler, Directions, State } from 'react-native-gesture-handler'

interface SwipeWrapperProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export const SwipeWrapper = ({ children, onSwipeLeft, onSwipeRight }: SwipeWrapperProps) => {
  return (
    // Gestor para el deslizamiento hacia la IZQUIERDA
    <FlingGestureHandler
      direction={Directions.LEFT}
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE && onSwipeLeft) {
          onSwipeLeft()
        }
      }}
    >
      {/* Gestor para el deslizamiento hacia la DERECHA */}
      <FlingGestureHandler
        direction={Directions.RIGHT}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE && onSwipeRight) {
            onSwipeRight()
          }
        }}
      >
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </FlingGestureHandler>
    </FlingGestureHandler>
  )
}