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
	let privateCurrentIndex = -1
	let animationDirection: AnimationDirection
	let playCount = 0
	// let isPaused = false

	// if the options.frames is provided, empty the main element and append the images
	if (mainElement && _options?.frames) {
		mainElement.innerHTML = ''

		if (_options?.poster) {
			createImageElement(mainElement, _options.poster, {
				'data-ff-poster': '',
			})
		}

		for (const element of _options.frames) {
			const image = createImageElement(mainElement, element)
			animationSequence.push(image)
		}

		animationSequenceLength = animationSequence.length + 1 // adding 1 because frameDuration array needs to have leading 0, so there is no timeout at the beginning
	}

	if (!_options?.frames) {
		// get all elements from the main element
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

			// animation = animate(framesDurationsArray, animateSequence)

			_options?.onLoad?.()

			if (_options?.autoplay) {
				play()
			}
		}
	})

	function animateSequence(currentIndex: number) {
		let indexToShow = currentIndex

		// avoid flickering when the last frame is shown
		if (currentIndex < animationSequenceLength - 1) {
			resetElementVisibility()
		}

		if (animationDirection === 'reverse') {
			indexToShow = animationSequenceLength - currentIndex - 2
		}

		if (animationSequence[indexToShow]) {
			animationSequence[indexToShow].setAttribute('data-ff-active', '')
			if (_options?.visibleClass) {
				animationSequence[indexToShow].classList.add(_options.visibleClass)
			}
		}

		privateCurrentIndex = currentIndex
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
			completeAnimationComparator = animationSequenceLength - 1
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
			_options?.onPlay?.({
				nextFrameNumber,
				currentIndex: privateCurrentIndex,
				animationDirection,
			})
		} else if (state === 'stop') {
			_options?.onStop?.({
				nextFrameNumber,
				currentIndex: privateCurrentIndex,
				animationDirection,
			})
		} else if (state === 'pause') {
			_options?.onPause?.({
				nextFrameNumber,
				currentIndex: privateCurrentIndex,
				animationDirection,
			})
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

	function setInitialFrameDurationArray(
		firstFrame?: number,
		lastFrame?: number,
	) {
		const firstFrameIndex = firstFrame || 1
		const lastFrameIndex = lastFrame || framesDurationsArray.length - 1
		if (
			_options.direction === 'alternate' ||
			_options.direction === 'alternate-reverse'
		) {
			if (animationDirection === 'reverse') {
				if (_options.direction === 'alternate') {
					framesDurationsArray[firstFrameIndex] = 0
				}
				framesDurationsArray[lastFrameIndex] = originalLastFrameDuration
			} else {
				framesDurationsArray[firstFrameIndex] = originalFirstFrameDuration
				if (_options.direction === 'alternate-reverse') {
					framesDurationsArray[lastFrameIndex] = 0
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
			const poster = mainElement?.querySelector('[data-ff-poster]')
			if (poster) {
				poster.removeAttribute('data-ff-hidden')
			}
			nextFrameNumber = -1
		}
	}

	/**
	 * Reset all elements visibility (remove active data attribute)
	 */
	function resetElementVisibility() {
		for (const element of animationSequence) {
			element.removeAttribute('data-ff-active')
			if (_options?.visibleClass) {
				element.classList.remove(_options.visibleClass)
			}
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

			if (animation === null) {
				animation = animate(framesDurationsArray, animateSequence)
			}

			setAnimationDirection()

			setInitialFrameDurationArray()

			// hide poster image if present
			const poster = mainElement?.querySelector('[data-ff-poster]')
			if (poster) {
				poster.setAttribute('data-ff-hidden', '')
			}

			animation?.start()

			handleEvents('play')
		}
	}

	// TODO: Play section of the animation, taking the start and end frames as an argument

	/**
	 * Pauses the sequence animation on the current frame
	 */
	function pause() {
		// isPaused = true
		animation?.stop()
		nextFrameNumber = privateCurrentIndex
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

		// isPaused = false
		// animation = null
		animationDirection = undefined
		setAnimationDirection()
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
	 * Resets all elements visibility and makes the current frame active
	 */
	function makeCurrentFrameActive() {
		resetElementVisibility()
		if (animationSequence[nextFrameNumber]) {
			animationSequence[nextFrameNumber].setAttribute('data-ff-active', '')
			if (_options?.visibleClass) {
				animationSequence[nextFrameNumber].classList.add(_options.visibleClass)
			}
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
