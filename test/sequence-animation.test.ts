import { describe, expect, test } from 'vitest'
import { sequenceAnimation } from '../src'

describe('sequenceAnimation', () => {
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
