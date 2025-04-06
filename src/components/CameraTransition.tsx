// CameraTransition.tsx
import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraTransitionProps {
  targetPos: THREE.Vector3   // The final camera position
  triggerAnimation: boolean  // A boolean that flips whenever we want a new animation
}

const CameraTransition: React.FC<CameraTransitionProps> = ({ targetPos, triggerAnimation }) => {
  const { camera } = useThree()

  // Keep track of the animation progress and the initial camera position
  const animProgressRef = useRef(0)
  const startPosRef = useRef(new THREE.Vector3())

  // Whenever the user toggles (triggerAnimation changes), we reset
  useEffect(() => {
    // Save the current camera position as the start of the next transition
    startPosRef.current.copy(camera.position)
    // Reset our progress
    animProgressRef.current = 0
  }, [triggerAnimation, camera])

  useFrame((_, delta) => {
    // If our progress is under 1, move the camera
    if (animProgressRef.current < 1) {
      animProgressRef.current = Math.min(animProgressRef.current + delta * 0.5, 1)
      camera.position.lerpVectors(
        startPosRef.current, 
        targetPos, 
        animProgressRef.current
      )
    }
  })

  return null
}

export default CameraTransition
