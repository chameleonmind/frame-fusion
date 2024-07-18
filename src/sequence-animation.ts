import type {
	AnimateCoreReturnType,
	AnimationStates,
	SequenceAnimationOptions,
} from '../types'
import { animate } from './core/animate'
import { clamp } from './core/clamp'

export function checkIfImagesAreLoaded(
	images: HTMLImageElement[],
): Promise<boolean> {
	return new Promise((resolve) => {
		let loaded = 0
		for (const image of images) {
			// check if image is loaded
			if (image.complete) {
				loaded++
			} else {
				image.addEventListener('load', () => {
					loaded++
					if (loaded === images.length) {
						resolve(true)
					}
				})
			}
		}
	})
}

function getFramesDuration(
	framesDuration: number[] | undefined,
	images: HTMLImageElement[],
	delay: number | undefined,
	framerate: number,
): number[] {
	// framesDuration > images data-ff-duration > delay > framerate
	if (
		Array.isArray(framesDuration) &&
		framesDuration.length === images.length
	) {
		// push 0 to the start of the array
		return [0, ...framesDuration]
	}
	if (
		images?.length &&
		images.some((image) => image.getAttribute('data-ff-delay'))
	) {
		const framesDurationArray: number[] = []
		for (const image of images) {
			if (image.getAttribute('data-ff-delay')) {
				framesDurationArray.push(
					Number.parseFloat(image.getAttribute('data-ff-delay') || '0.1'),
				)
			} else {
				framesDurationArray.push(0.1)
			}
		}

		return [0, ...framesDurationArray]
	}
	if (delay) {
		return [0, ...Array.from({ length: images.length }, () => delay)]
	}

	return [
		0,
		...Array.from({ length: images.length }, () => (1 / framerate) * 1000),
	]
}

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

	let imageSequence: HTMLImageElement[] = []
	let imageSequenceLength = 0
	let imagesLoaded = false
	let framesDurationsArray: number[] = []
	let originalFirstFrameDuration = 0
	let originalLastFrameDuration = 0
	let animation: AnimateCoreReturnType | null = null
	let nextFrameNumber = -1
	let animationDirection: 'forward' | 'reverse' | undefined
	let playCount = 0

	// if the options.frames is provided, empty the main element and append the images
	if (mainElement && _options?.frames) {
		mainElement.innerHTML = ''
		for (const frame of _options.frames) {
			const image = document.createElement('img')
			image.src = frame
			mainElement.appendChild(image)
			imageSequence.push(image)
		}

		imageSequenceLength = imageSequence.length + 1 // adding 1 because frameDuration array needs to have leading 0, so there is no timeout at the beginning
	}

	if (!_options?.frames) {
		// get all images from the main element
		const selector = options?.selector
			? `${options?.selector}:not([data-ff-poster])`
			: 'img:not([data-ff-poster])'
		imageSequence = Array.from(mainElement?.querySelectorAll(selector) || [])
		imageSequenceLength = imageSequence.length + 1
	}

	framesDurationsArray = getFramesDuration(
		_options.framesDuration,
		imageSequence,
		_options.delay,
		_options.framerate,
	)

	originalFirstFrameDuration = framesDurationsArray[1] // 1 because the first frame is skipped
	originalLastFrameDuration =
		framesDurationsArray[framesDurationsArray.length - 1]

	checkIfImagesAreLoaded(imageSequence).then((isLoaded) => {
		if (isLoaded) {
			imagesLoaded = true

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
		if (imageSequence[indexToShow]) {
			resetImages()
		}

		if (animationDirection === 'reverse') {
			indexToShow = imageSequenceLength - currentIndex - 2
		}

		// Add class to the current image
		if (imageSequence[indexToShow]) {
			imageSequence[indexToShow].classList.add('ff-active')
		}

		nextFrameNumber = (currentIndex + 1) % imageSequenceLength

		if (
			nextFrameNumber === imageSequenceLength - 1 &&
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
			completeAnimationComparator = imageSequenceLength - 1
		} else if (
			_options.direction === 'alternate-reverse' ||
			_options.direction === 'reverse'
		) {
			completeAnimationComparator = -1
		} else {
			completeAnimationComparator = imageSequenceLength - 2
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
				nextFrameNumber = imageSequenceLength - 2
			}
		} else if (_options.fillMode === 'backwards') {
			if (
				_options.direction === 'alternate' ||
				_options.direction === 'reverse'
			) {
				nextFrameNumber = imageSequenceLength - 2
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
		// Reset all images
		for (const img of imageSequence) {
			img.classList.remove('ff-active')
		}
	}

	/**
	 * Play the sequence animation
	 * @param forcePlay - force play even if images are not loaded
	 */
	function play(forcePlay?: boolean) {
		if (imagesLoaded || forcePlay) {
			// in case of intentional play, reset the repeat count
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

		resetImages()

		if (imageSequence[nextFrameNumber])
			imageSequence[nextFrameNumber].classList.add('ff-active')

		animation?.stop()
		animation?.reset()
		// animationDirection = undefined
		handleEvents('stop')
	}

	function setInitialAnimationDirection() {
		if (nextFrameNumber < 0) {
			setAnimationDirection()
		}
	}

	function updateNextFrameNumber(intent: 'next' | 'previous') {
		const isReverse = animationDirection === 'reverse'
		const lastFrame = imageSequenceLength - 2
		if (isReverse) {
			// if (intent === 'next') {
			// 	nextFrameNumber = nextFrameNumber > 0 ? nextFrameNumber - 1 : lastFrame
			// } else {
			// 	nextFrameNumber = nextFrameNumber < lastFrame ? nextFrameNumber + 1 : 0
			// }
			nextFrameNumber =
				intent === 'next'
					? nextFrameNumber > 0
						? nextFrameNumber - 1
						: lastFrame
					: nextFrameNumber < lastFrame
						? nextFrameNumber + 1
						: 0
		} else {
			// if (intent === 'next') {
			// 	nextFrameNumber = nextFrameNumber < lastFrame ? nextFrameNumber + 1 : 0
			// } else {
			// 	nextFrameNumber = nextFrameNumber > 0 ? nextFrameNumber - 1 : lastFrame
			// }
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
		const isLastFrame = nextFrameNumber === imageSequenceLength - 2
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

	function makeCurrentFrameActive() {
		resetImages()
		if (imageSequence[nextFrameNumber]) {
			imageSequence[nextFrameNumber].classList.add('ff-active')
		}
	}
	/**
	 * Move to the next frame in the sequence.
	 * Respects the animation direction and the fill mode.
	 */
	function nextFrame() {
		if (nextFrameNumber < 0) {
			setAnimationDirection()
		}
		// setInitialAnimationDirection()

		// if (animationDirection === 'reverse') {
		// 	if (nextFrameNumber > 0) {
		// 		nextFrameNumber--
		// 	} else {
		// 		nextFrameNumber = imageSequenceLength - 2
		// 	}
		// } else {
		// 	if (nextFrameNumber < imageSequenceLength - 2) {
		// 		nextFrameNumber++
		// 	} else {
		// 		nextFrameNumber = 0
		// 	}
		// }
		updateNextFrameNumber('next')

		// change the animation direction if the next frame is the last frame

		// if (
		//   nextFrameNumber === imageSequenceLength - 2 &&
		//   animationDirection === 'forward' &&
		//   (_options.direction === 'alternate' ||
		//     _options.direction === 'alternate-reverse')
		// ) {
		//   animationDirection =
		//     animationDirection === 'forward' ? 'reverse' : 'forward'
		// } else if (
		//   nextFrameNumber === 0 &&
		//   animationDirection === 'reverse' &&
		//   (_options.direction === 'alternate' ||
		//     _options.direction === 'alternate-reverse')
		// ) {
		//   animationDirection =
		//     animationDirection === 'reverse' ? 'forward' : 'reverse'
		// }
		updateAnimationDirection('next')

		resetImages()

		if (imageSequence[nextFrameNumber]) {
			imageSequence[nextFrameNumber].classList.add('ff-active')
		}
		// makeCurrentFrameActive()

		animation?.setFrame(nextFrameNumber)
	}

	/**
	 * Move to the previous frame in the sequence.
	 * Respects the animation direction and the fill mode.
	 */
	function previousFrame() {
		// if (nextFrameNumber < 0) {
		// 	setAnimationDirection()
		// }
		setInitialAnimationDirection()

		// if (animationDirection === 'reverse') {
		// 	if (nextFrameNumber < imageSequenceLength - 2) {
		// 		nextFrameNumber++
		// 	} else {
		// 		nextFrameNumber = 0
		// 	}
		// } else {
		// 	if (nextFrameNumber > 0) {
		// 		nextFrameNumber--
		// 	} else {
		// 		nextFrameNumber = imageSequenceLength - 2
		// 	}
		// }
		updateNextFrameNumber('previous')

		// change the animation direction if the next frame is the first frame
		// if (
		// 	nextFrameNumber === 0 &&
		// 	animationDirection === 'forward' &&
		// 	(_options.direction === 'alternate' ||
		// 		_options.direction === 'alternate-reverse')
		// ) {
		// 	animationDirection =
		// 		animationDirection === 'forward' ? 'reverse' : 'forward'
		// } else if (
		// 	nextFrameNumber === imageSequenceLength - 2 &&
		// 	animationDirection === 'reverse' &&
		// 	(_options.direction === 'alternate' ||
		// 		_options.direction === 'alternate-reverse')
		// ) {
		// 	animationDirection =
		// 		animationDirection === 'reverse' ? 'forward' : 'reverse'
		// }
		updateAnimationDirection('previous')

		// resetImages()

		// if (imageSequence[nextFrameNumber]) {
		// 	imageSequence[nextFrameNumber].classList.add('ff-active')
		// }
		makeCurrentFrameActive()

		animation?.setFrame(nextFrameNumber)
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

		nextFrameNumber = clamp(frameNumber, 0, imageSequenceLength - 2)

		resetImages()

		if (imageSequence[nextFrameNumber]) {
			imageSequence[nextFrameNumber].classList.add('ff-active')
		}

		const nextFrame =
			nextFrameNumber === imageSequenceLength - 2 ? 0 : nextFrameNumber
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
