# Frame Fusion

Animate sequence of images.

Just like animated GIFs or animated PNGs, but you can use higher quality images and have more
control over the animation.

Documentation is available on [chameleonmind.dev/frame-fusion](https://chameleonmind.dev/frame-fusion).

## Installation

```bash
npm install @chameleonmind/frame-fusion
```

Frame Fusion comes with a small CSS file that you can include in your project.

```js
import '@chameleonmind/frame-fusion/styles/main.css'
```

## Usage

If you have a sequence of images, place them inside a container with the `data-ff-wrapper` attribute.

In this example, we have 6 images in a container with the `data-ff-wrapper` attribute, an id which we will use to
initialize the animation, and a height of 400px, just to avoid the additional CSS.

```html

<div id="animatedFrames" data-ff-wrapper style="height: 400px">
  <img src="https://placehold.co/600x400?text=1" alt="Frame 1">
  <img src="https://placehold.co/600x400?text=2" alt="Frame 2">
  <img src="https://placehold.co/600x400?text=3" alt="Frame 3">
  <img src="https://placehold.co/600x400?text=4" alt="Frame 4">
  <img src="https://placehold.co/600x400?text=5" alt="Frame 5">
  <img src="https://placehold.co/600x400?text=6" alt="Frame 6">
</div>
```

Then initialize the animation with the `sequenceAnimation` function.

```js
import {sequenceAnimation} from '@chameleonmind/frame-fusion'

const animation = sequenceAnimation('#animatedFrames', {
  autoplay: true,
  delay: 50,
})
```

The `autoplay` option is set to `true` so the animation will start automatically when the page and images are loaded.

### Options

You can pass an options object to the `sequenceAnimation` function, for example:

```js
import {sequenceAnimation} from '@chameleonmind/frame-fusion'

const animation = sequenceAnimation('#animatedFrames', {
  // options here
})
```

| Option              | Type       | Default     | Description                                                                                                                                                                                                               |
|---------------------|------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `autoplay`          | `boolean`  | `false`     | Start the animation automatically when the page and images are loaded.                                                                                                                                                    |
| `delay`             | `number`   | `undefined` | Delay in milliseconds between each frame.                                                                                                                                                                                 |
| `framerate`         | `number`   | `24`        | Number of frames per second.                                                                                                                                                                                              |
| `fillMode`          | `string`   | `forwards`  | The fill mode of the animation. Can be `forwards`, `backwards` or `poster`.                                                                                                                                               |
| `direction`         | `string`   | `normal`    | The direction of the animation. Can be `normal`, `reverse`, `alternate` or `alternate-reverse`.                                                                                                                           |
| `repeat`            | `number`   | `undefined` | The number of times the animation should repeat.                                                                                                                                                                          |
| `visibleClass`      | `string`   | `undefined` | Class name to add to the visible frames. Use this if you want to provide your own CSS.                                                                                                                                    |
| `posterHiddenClass` | `string`   | `undefined` | Class name to add to the poster image when it is hidden.  Use this if you want to provide your own CSS.                                                                                                                   |
| `keepFramesVisible` | `boolean`  | `false`     | Keep the frames visible for the previous frames. Use this if you want your animation to stack up all your frames. Works only with `direction: normal` for now.                                                            |
| `selector`          | `string`   | `undefined` | CSS selector to use to find the images. Useful if you have images that shouldn't be included in the animation, but are in the container element. Potentialy, it could be used for frames that are not necessarily images. |
| `frames`            | `string[]` | `undefined` | Array of image paths. If provided, the image elements will be created from the paths. You cannot apply any other attributes or classes to the images. The images will be appended to the main element.                    |
| `poster`            | `string`   | `undefined` | Path to the poster image. If provided, the image will be created from the path. You cannot apply any other attributes or classes to the image. The image will be appended to the main element.                            |

### Callbacks

You can pass a callback function to the `sequenceAnimation` function, for example:

```js
import {sequenceAnimation} from '@chameleonmind/frame-fusion'

const animation = sequenceAnimation('#animatedFrames', {
  // options here
  onChangeState: (state) => {
    console.log('state', state)
  },
})
```

| Option          | Type       | Args                                                                                            | Description                                                        |
|-----------------|------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| `onLoad`        | `function` | `void`                                                                                          | Callback function that is called when the animation is loaded.     |
| `onEnd`         | `function` | `void`                                                                                          | Callback function that is called when the animation ends.          |
| `onRepeat`      | `function` | `void`                                                                                          | Callback function that is called when the animation repeats.       |
| `onStop`        | `function` | `{ currentIndex: number, nextFrameNumber: number, animationDirection: 'forward' \| 'reverse' }` | Callback function that is called when the animation is stopped.    |
| `onPlay`        | `function` | `{ currentIndex: number, nextFrameNumber: number, animationDirection: 'forward' \| 'reverse' }` | Callback function that is called when the animation is played.     |
| `onPause`       | `function` | `{ currentIndex: number, nextFrameNumber: number, animationDirection: 'forward' \| 'reverse' }` | Callback function that is called when the animation is paused.     |
| `onChangeState` | `function` | `state: 'play' \| 'pause' \| 'stop'`                                                            | Callback function that is called when the animation state changes. |
| `onReverse`     | `function` | `void`                                                                                          | Callback function that is called when the animation is reversed.   |

### Methods

You can call the following methods on the animation object returned by the `sequenceAnimation` function. Other
than `goToFrame` method, the methods don't take any arguments.

| Method          | Description                  |
|-----------------|------------------------------|
| `play`          | Starts the animation.        |
| `pause`         | Pauses the animation.        |
| `stop`          | Stops the animation.         |
| `nextFrame`     | Moves to the next frame.     |
| `previousFrame` | Moves to the previous frame. |
| `restart`       | Restarts the animation.      |
| `goToFrame`     | Go to a specific frame.      |

## License

[MIT License](./LICENSE)

## Author

Frame Fusion &copy; [ChameleonMind](https://github.com/chameleonmind).\
Authored and maintained by Miloš Milošević.


> Website [chameleonmind.dev](https://chameleonmind.dev) &nbsp;&middot;&nbsp;
> GitHub [@chameleonmind](https://github.com/chameleonmind) &nbsp;&middot;&nbsp;
> Twitter [@chameleon_mind](https://twitter.com/chameleon_mind)
