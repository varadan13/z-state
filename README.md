

Hey guys, today let’s learn how to build a small script with an API similar to Alpine.js. Let’s look at the UI we have here—it’s very simple.

![UI](https://github.com/varadan13/z-state/blob/main/assets/counter-ui.gif)

The UI is a counter. It has an increment button and a decrement button. When we click the increment button, it increases the count by one, and when we click the decrement button, it decreases the count by one.

Here’s how the UI is implemented in code:

```html
<h1>Simple Counter</h1>
<div z-data="{ count: 0 }">
    <button z-on:click="count++">Increment</button>
    <span z-text="count"></span>
    <button z-on:click="count<=0?count:count--">Decrement</button>
</div>

<script src="script.js"></script>
```

As you can see, the code is pretty straightforward. Just observe that some of these HTML tags have custom attributes: `z-data`, `z-on` and `z-text`. `script.js` is being imported. The UI uses these attributes and the script file for reactivity.

Now, let's jump into `script.js` file:

```js
if (!window.ZState) {
  window.ZState = ZState;
  window.ZState.start();
}
```

This is the entry point. Initially, we check whether `window` has a `ZState` property. If it doesn’t, we assign that property to the `ZState` object and finally, we call the `start` method of the `ZState` object.

`ZState` object:

```js
const ZState = {
  start: async function () {
    await domReady();

    this.discoverComponents((el) => {
      this.initializeElement(el);
    });
  },

  discoverComponents: function (callback) {
    const rootEls = document.querySelectorAll("[z-data]");

    rootEls.forEach((rootEl) => {
      callback(rootEl);
    });
  },

  initializeElement: function (el) {
    new Component(el);
  },
};
```

Again, not much magic here. It has three methods: `start`, `discoverComponents` and `initializeElements`. 

Let's understand `start` method:

```js
async function () {
    await domReady();

    this.discoverComponents((el) => {
      this.initializeElement(el);
    });
  }
```

It awaits the function `domReady` and invokes `discoverComponents` where the callback has `initializeElement` invoked in it's body.

So basically `start` method discovers all the required DOM nodes and initializes them.

So, what happens inside the `domReady` function? and Why do we need it?

Why do we need `domReady`?

Basically, this script needs to read the DOM tree, so it naturally has to check whether the DOM tree has been properly initialized or not.

`domReady` function:

```js
function domReady() {
  return new Promise((resolve) => {
    if (document.readyState == "loading") {
      document.addEventListener("DOMContentLoaded", resolve);
    } else {
      resolve();
    }
  });
}
```

As we already know, this function returns a promise, which resolves if the document’s `readyState` is not `loading` or when the `DOMContentLoaded` event fires.







