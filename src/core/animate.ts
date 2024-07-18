import type { AnimateCoreReturnType } from '../../types'

export function animate(
	framesDuration: number[],
	callback: (currentFrame: number) => number,
): AnimateCoreReturnType {
	let startTime = 0
	let currentIndex = 0
	let animationFrameId: number | null = 0

	function animateFrames(timestamp: number) {
		if (!startTime) startTime = timestamp // Set the start time on the first frame
		const elapsedTime = timestamp - startTime
		// Check if elapsed time exceeds the current index's delay
		if (elapsedTime >= framesDuration[currentIndex]) {
			const nextIndex = callback(currentIndex)

			startTime = timestamp
			currentIndex = nextIndex
		}

		if (animationFrameId !== null) {
			animationFrameId = requestAnimationFrame(applyFrameAnimation)
		}
	}

	function applyFrameAnimation(timestamp: number) {
		animateFrames(timestamp)
	}

	const start = () => {
		animationFrameId = requestAnimationFrame(applyFrameAnimation)
	}

	const stop = () => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId)
			animationFrameId = null
			startTime = 0
		}
	}

	const reset = () => {
		startTime = 0
		currentIndex = 0
		animationFrameId = null
	}

	const setFrame = (index: number) => {
		currentIndex = index
	}

	return {
		start,
		stop,
		reset,
		setFrame,
	}
}
