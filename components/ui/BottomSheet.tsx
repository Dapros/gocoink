import React, { forwardRef, useCallback } from 'react'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { COLORS } from '@/constants/theme'

interface BottomSheetProps {
  children: React.ReactNode
  snapPoints?: string[] // ej: ['50%', '90%']
  enableDynamicSizing?: boolean
}

export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  ({ children, snapPoints, enableDynamicSizing = false }, ref) => {

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      ),
      []
    )

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: COLORS.surface }}
        handleIndicatorStyle={{ backgroundColor: COLORS.border, width: 40 }}
        keyboardBehavior='interactive'
        keyboardBlurBehavior='restore'
      >
        <BottomSheetView style={{ padding: 20 }}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    )
  }
)