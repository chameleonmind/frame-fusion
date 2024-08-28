export type AnimationStates = 'play' | 'pause' | 'stop'

export type SequenceAnimationOptions = {
	selector?: string
	frames?: string[] // Array of image paths
	poster?: string
	autoplay?: boolean
	framerate?: number
	delay?: number[] | number
	repeat?: number
	fillMode?: 'forwards' | 'backwards' | 'poster'
	direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
	visibleClass?: string
	onLoad?: () => void
	onEnd?: () => void
	onRepeat?: () => void
	onStop?: (data?: CallbackData) => void
	onPlay?: (data?: CallbackData) => void
	onPause?: (data?: CallbackData) => void
	onChangeState?: (state: AnimationStates) => void
	onReverse?: () => void
}

export type AnimateCoreReturnType = {
	start: () => void
	stop: () => void
	reset: () => void
	setFrame: (index: number) => void
}

export type AnimationDirection = 'forward' | 'reverse' | undefined

export type AnimationSequenceElements = HTMLImageElement[] | HTMLElement[]

export type CallbackData = {
	currentIndex: number
	nextFrameNumber: number
	animationDirection: AnimationDirection
}
