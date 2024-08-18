import { beforeEach, describe, expect, test, vi } from 'vitest'
import { sequenceAnimation } from '../src'

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('sequenceAnimation setup', () => {
	test('should return an object', () => {
		const animation = sequenceAnimation('#animatedFrames', {
			framerate: 24,
			autoplay: true,
			fillMode: 'forwards',
			direction: 'alternate',
			onChangeState: (state) => {
				console.log('state', state)
			},
			onLoad: () => {
				console.log('images loaded')
			},
		})

		expect(animation).toBeTruthy()
	})

	test('should return an object with play, pause, stop, nextFrame, previousFrame, restart and goToFrame methods', () => {
		const animation = sequenceAnimation('#animatedFrames', {
			framerate: 24,
			autoplay: true,
			fillMode: 'forwards',
			direction: 'alternate',
			onChangeState: (state) => {
				console.log('state', state)
			},
			onLoad: () => {
				console.log('images loaded')
			},
		})

		expect(animation.play).toBeTruthy()
		expect(animation.pause).toBeTruthy()
		expect(animation.stop).toBeTruthy()
		expect(animation.nextFrame).toBeTruthy()
		expect(animation.previousFrame).toBeTruthy()
		expect(animation.restart).toBeTruthy()
		expect(animation.goToFrame).toBeTruthy()
	})
})

describe('sequenceAnimation commands', () => {
	let element: HTMLElement

	beforeEach(() => {
		document.body.innerHTML = `
      <div id="animatedFrames" data-ff-wrapper="" style="height: 434px">
        <img src="https://placehold.co/600x400?text=1">
        <img src="https://placehold.co/600x400?text=2">
        <img src="https://placehold.co/600x400?text=3">
        <img src="https://placehold.co/600x400?text=4">
      </div>
    `
		element = document.querySelector('#animatedFrames') as HTMLElement
	})

	test('should initialize and play the animation', async () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: true,
			delay: 50,
		})

		expect(animation).toBeDefined()

		const playSpy = vi.spyOn(animation, 'play')
		animation.play(true)

		expect(playSpy).toHaveBeenCalled()

		await delay(100)
		expect(element.querySelectorAll('[data-ff-active]').length).toBe(1)
	})

	test('should pause the animation', async () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: false,
			framerate: 24,
		})

		animation.play(true)

		await delay(100)
		const pauseSpy = vi.spyOn(animation, 'pause')
		animation.pause()

		expect(pauseSpy).toHaveBeenCalled()

		const activeElements = element.querySelectorAll('[data-ff-active]')
		expect(activeElements.length).toBe(1)
	})

	test('should stop the animation on the last frame', async () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: false,
			framerate: 24,
		})

		animation.play(true)
		await delay(100)
		animation.stop()

		const activeElements = element.querySelectorAll('[data-ff-active]')
		expect(activeElements.length).toBe(1)

		// last element should be active when fillMode is set to forwards (default)
		const images = element.querySelectorAll('img')
		expect(images[images.length - 1].hasAttribute('data-ff-active')).toBe(true)
	})

	test('should stop the animation on the first frame when fillMode is set to backwards', async () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: false,
			framerate: 24,
			fillMode: 'backwards',
		})

		animation.play(true)
		await delay(100)
		animation.stop()

		const activeElements = element.querySelectorAll('[data-ff-active]')
		expect(activeElements.length).toBe(1)
		// last element should be active
		const images = element.querySelectorAll('img')
		expect(images[0].hasAttribute('data-ff-active')).toBe(true)
	})

	test('should move to the next frame', async () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: false,
			delay: 50,
		})

		animation.nextFrame()
		animation.nextFrame()

		const activeElements = element.querySelectorAll('[data-ff-active]')
		expect(activeElements.length).toBe(1)
		const images = element.querySelectorAll('img')
		expect(images[1].hasAttribute('data-ff-active')).toBe(true)
	})

	test('should move to the previous frame', () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: false,
			framerate: 24,
		})

		animation.previousFrame()
		animation.previousFrame()

		const activeElements = element.querySelectorAll('[data-ff-active]')
		expect(activeElements.length).toBe(1)

		const images = element.querySelectorAll('img')
		expect(images[images.length - 2].hasAttribute('data-ff-active')).toBe(true)
	})

	test('should go to a specific frame', () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: false,
			framerate: 24,
		})

		animation.goToFrame(2)

		const activeElements = element.querySelectorAll('[data-ff-active]')
		expect(activeElements.length).toBe(1)
		expect(
			element.querySelectorAll('img')[2].hasAttribute('data-ff-active'),
		).toBe(true)
	})

	test('should restart the animation', async () => {
		const animation = sequenceAnimation('#animatedFrames', {
			autoplay: false,
			delay: 50,
		})

		animation.play(true)

		await delay(100)

		animation.restart()
		animation.pause()

		const activeElements = element.querySelectorAll('[data-ff-active]')
		expect(activeElements.length).toBe(1)

		const images = element.querySelectorAll('img')

		expect(images[1].hasAttribute('data-ff-active')).toBe(true)
	})
})
