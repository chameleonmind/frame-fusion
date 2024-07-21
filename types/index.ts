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
	onLoad?: () => void
	onEnd?: () => void
	onRepeat?: () => void
	onStop?: () => void
	onPlay?: () => void
	onPause?: () => void
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

export type AnimationSequenceElements =
	| HTMLImageElement[]
	| HTMLElement[]
	| Element[]
