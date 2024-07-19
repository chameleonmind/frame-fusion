export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max)
}

export function createImageElement(
	container: Element | null,
	src: string,
	attributes?: Record<string, string>,
): HTMLImageElement {
	const image = document.createElement('img')
	image.src = src
	if (attributes) {
		for (const [key, value] of Object.entries(attributes)) {
			image.setAttribute(key, value)
		}
	}
	container?.appendChild(image)
	return image
}

export function getFramesDuration(
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
