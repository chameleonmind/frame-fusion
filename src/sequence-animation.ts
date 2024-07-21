import type {
	AnimateCoreReturnType,
	AnimationDirection,
	AnimationSequenceElements,
	AnimationStates,
	SequenceAnimationOptions,
} from '../types'
import { animate } from './core/animate'
import {
	checkIfImagesAreLoaded,
	clamp,
	createImageElement,
	getFramesDuration,
} from './core/utils'

export function sequenceAnimation(
	elementSelector: string,
	options?: SequenceAnimationOptions,
) {
	const _options: Required<
		Pick<SequenceAnimationOptions, 'framerate' | 'direction'>
	> &
		SequenceAnimationOptions = {
		autoplay: true,
		framerate: 24,
		fillMode: 'forwards',
		direction: 'normal',
		...options,
	}

	const mainElement = document.querySelector(elementSelector)

	let animationSequence: AnimationSequenceElements = []
	let animationSequenceLength = 0
	let animationElementsLoaded = false
	let framesDurationsArray: number[] = []
	let originalFirstFrameDuration = 0
	let originalLastFrameDuration = 0
	let animation: AnimateCoreReturnType | null = null
	let nextFrameNumber = -1
	let animationDirection: AnimationDirection
	let playCount = 0

	// if the options.frames is provided, empty the main element and append the images
	if (mainElement && _options?.frames) {
		mainElement.innerHTML = ''

		if (_options?.poster) {
			createImageElement(mainElement, _options.poster, {
				'data-ff-poster': '',
			})
		}

		for (let i = 0; i < _options.frames.length; i++) {
			const image = createImageElement(mainElement, _options.frames[i])
			animationSequence.push(image)
		}

		animationSequenceLength = animationSequence.length + 1 // adding 1 because frameDuration array needs to have leading 0, so there is no timeout at the beginning
	}

	if (!_options?.frames) {
		// get all images from the main element
		const selector = options?.selector
			? `${options?.selector}:not([data-ff-poster])`
			: 'img:not([data-ff-poster])'
		animationSequence = Array.from(
			mainElement?.querySelectorAll(selector) || [],
		)
		animationSequenceLength = animationSequence.length + 1
	}

	framesDurationsArray = getFramesDuration(
		animationSequence,
		_options.delay,
		_options.framerate,
	)

	originalFirstFrameDuration = framesDurationsArray[1] // 1 because the first frame is skipped
	originalLastFrameDuration =
		framesDurationsArray[framesDurationsArray.length - 1]

	checkIfImagesAreLoaded(animationSequence).then((isLoaded) => {
		if (isLoaded) {
			animationElementsLoaded = true

			animation = animate(framesDurationsArray, animateSequence)

			if (_options?.autoplay) {
				play()
			}

			_options?.onLoad?.()
		}
	})

	function animateSequence(currentIndex: number) {
		let indexToShow = currentIndex
		// Reset all images
		resetImages()

		if (animationDirection === 'reverse') {
			indexToShow = animationSequenceLength - currentIndex - 2
		}

		if (animationSequence[indexToShow]) {
			animationSequence[indexToShow].classList.add('ff-active')
		}

		nextFrameNumber = (currentIndex + 1) % animationSequenceLength

		if (
			nextFrameNumber === animationSequenceLength - 1 &&
			(_options.direction === 'alternate' ||
				_options.direction === 'alternate-reverse')
		) {
			animationDirection =
				animationDirection === 'forward' ? 'reverse' : 'forward'

			setFrameDurationArrayFromDirection(animationDirection)
			_options?.onReverse?.()
		}

		// update the play count after complete animation
		let completeAnimationComparator: number
		if (_options.direction === 'alternate') {
			completeAnimationComparator = animationSequenceLength - 1
		} else if (
			_options.direction === 'alternate-reverse' ||
			_options.direction === 'reverse'
		) {
			completeAnimationComparator = -1
		} else {
			completeAnimationComparator = animationSequenceLength - 2
		}

		if (indexToShow === completeAnimationComparator) {
			playCount++
			_options?.onRepeat?.()
		}

		if (_options?.repeat && playCount >= _options?.repeat) {
			stop()
			return 0
		}
		// Update the index for the next frame
		return nextFrameNumber
	}

	function handleEvents(state: AnimationStates) {
		if (state === 'play') {
			_options?.onPlay?.()
		} else if (state === 'stop') {
			_options?.onStop?.()
		} else if (state === 'pause') {
			_options?.onPause?.()
		}

		_options.onChangeState?.(state)
	}

	function setFrameDurationArrayFromDirection(
		direction: 'reverse' | 'forward',
	) {
		if (direction === 'reverse') {
			framesDurationsArray[1] = 0
			framesDurationsArray[framesDurationsArray.length - 1] =
				originalLastFrameDuration
		} else {
			framesDurationsArray[1] = originalFirstFrameDuration
			framesDurationsArray[framesDurationsArray.length - 1] = 0
		}
	}

	function setInitialFrameDurationArray() {
		if (
			_options.direction === 'alternate' ||
			_options.direction === 'alternate-reverse'
		) {
			if (animationDirection === 'reverse') {
				if (_options.direction === 'alternate') {
					framesDurationsArray[1] = 0
				}
				framesDurationsArray[framesDurationsArray.length - 1] =
					originalLastFrameDuration
			} else {
				framesDurationsArray[1] = originalFirstFrameDuration
				if (_options.direction === 'alternate-reverse') {
					framesDurationsArray[framesDurationsArray.length - 1] = 0
				}
			}
		}
	}

	function setAnimationDirection() {
		animationDirection =
			animationDirection ||
			(_options.direction === 'reverse' ||
			_options.direction === 'alternate-reverse'
				? 'reverse'
				: 'forward')
	}

	/**
	 * Set the end frame based on the fill mode
	 */
	function setEndFrame() {
		if (_options.fillMode === 'forwards') {
			if (
				_options.direction === 'alternate' ||
				_options.direction === 'reverse'
			) {
				nextFrameNumber = 0
			} else {
				nextFrameNumber = animationSequenceLength - 2
			}
		} else if (_options.fillMode === 'backwards') {
			if (
				_options.direction === 'alternate' ||
				_options.direction === 'reverse'
			) {
				nextFrameNumber = animationSequenceLength - 2
			} else {
				nextFrameNumber = 0
			}
		} else {
			// show poster image if present
			const poster = mainElement?.querySelector('img[data-ff-poster]')
			if (poster) {
				poster.classList.remove('ff-hidden')
			}
			nextFrameNumber = -1
		}
	}

	/**
	 * Reset all images (remove active class)
	 */
	function resetImages() {
		for (let i = 0; i < animationSequence.length; i++) {
			animationSequence[i].classList.remove('ff-active')
		}
	}

	/**
	 * Play the sequence animation
	 * @param forcePlay - force play even if images are not loaded
	 */
	function play(forcePlay?: boolean) {
		if (animationElementsLoaded || forcePlay) {
			// in case of intentional play, need to reset the repeat count
			_options.repeat = options?.repeat
			playCount = 0

			setAnimationDirection()

			setInitialFrameDurationArray()

			// hide poster image if present
			const poster = mainElement?.querySelector('img[data-ff-poster]')
			if (poster) {
				poster.classList.add('ff-hidden')
			}

			animation?.start()

			handleEvents('play')
		}
	}

	/**
	 * Pauses the sequence animation on the current frame
	 */
	function pause() {
		animation?.stop()
		handleEvents('pause')
	}

	/**
	 * Stops the sequence animation, reset the animation and set the end frame
	 */
	function stop() {
		setEndFrame()

		makeCurrentFrameActive()

		animation?.stop()
		animation?.reset()

		handleEvents('stop')
	}

	function setInitialAnimationDirection() {
		if (nextFrameNumber < 0) {
			setAnimationDirection()
		}
	}

	function updateNextFrameNumber(intent: 'next' | 'previous') {
		const isReverse = animationDirection === 'reverse'
		const lastFrame = animationSequenceLength - 2
		if (isReverse) {
			nextFrameNumber =
				intent === 'next'
					? nextFrameNumber > 0
						? nextFrameNumber - 1
						: lastFrame
					: nextFrameNumber < lastFrame
						? nextFrameNumber + 1
						: 0
		} else {
			nextFrameNumber =
				intent === 'next'
					? nextFrameNumber < lastFrame
						? nextFrameNumber + 1
						: 0
					: nextFrameNumber > 0
						? nextFrameNumber - 1
						: lastFrame
		}
	}

	function toggleAnimationDirection() {
		if (animationDirection === 'reverse') {
			animationDirection = 'forward'
		} else {
			animationDirection = 'reverse'
		}
	}

	function updateAnimationDirection(intent: 'next' | 'previous') {
		const isLastFrame = nextFrameNumber === animationSequenceLength - 2
		const isFirstFrame = nextFrameNumber === 0
		const isForward = animationDirection === 'forward'
		const isReverse = animationDirection === 'reverse'
		const isAlternatingAnimation = ['alternate', 'alternate-reverse'].includes(
			_options.direction,
		)

		if (intent === 'next') {
			if (isLastFrame && isForward && isAlternatingAnimation) {
				toggleAnimationDirection()
			} else if (isFirstFrame && isReverse && isAlternatingAnimation) {
				toggleAnimationDirection()
			}
		} else {
			if (isFirstFrame && isForward && isAlternatingAnimation) {
				toggleAnimationDirection()
			} else if (isLastFrame && isReverse && isAlternatingAnimation) {
				toggleAnimationDirection()
			}
		}
	}

	/**
	 * Resets all images and makes the current frame active
	 */
	function makeCurrentFrameActive() {
		resetImages()
		if (animationSequence[nextFrameNumber]) {
			animationSequence[nextFrameNumber].classList.add('ff-active')
		}
	}

	function stepThroughFrames(dir: 'next' | 'previous') {
		setInitialAnimationDirection()

		updateNextFrameNumber(dir)

		updateAnimationDirection(dir)

		makeCurrentFrameActive()

		animation?.setFrame(nextFrameNumber)
	}
	/**
	 * Move to the next frame in the sequence.
	 * Respects the animation direction and the fill mode.
	 */
	function nextFrame() {
		stepThroughFrames('next')
	}

	/**
	 * Move to the previous frame in the sequence.
	 * Respects the animation direction and the fill mode.
	 */
	function previousFrame() {
		stepThroughFrames('previous')
	}

	/**
	 * Go to a specific frame in the sequence.
	 * The animation direction is NOT respected, it will move to the absolute frame number, regardless of the animation direction.
	 * If the frame number is out of bounds, it will move to the closest absolute frame number, min or max.
	 * @param frameNumber
	 */
	function goToFrame(frameNumber: number) {
		if (nextFrameNumber < 0) {
			setAnimationDirection()
		}

		nextFrameNumber = clamp(frameNumber, 0, animationSequenceLength - 2)

		makeCurrentFrameActive()

		const nextFrame =
			nextFrameNumber === animationSequenceLength - 2 ? 0 : nextFrameNumber
		animation?.setFrame(nextFrame)
	}

	/**
	 * Restarts the sequence animation.
	 * It's the same as calling `stop` and then `play`.
	 */
	function restart() {
		animation?.stop()
		animation?.reset()
		play()
	}

	return {
		play,
		pause,
		stop,
		nextFrame,
		previousFrame,
		restart,
		goToFrame,
	}
}
