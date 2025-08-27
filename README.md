

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

Now, let's jump into `discoverComponents` function.

`discoverComponents` function:

```js
function (callback) {
    const rootEls = document.querySelectorAll("[z-data]");

    rootEls.forEach((rootEl) => {
      callback(rootEl);
    });
  }
```
So, it invokes the callback on all the DOM nodes that have the z-data attribute. If we jump back into the HTML code, we see there is only one. 

What is the callback it receives? To find that out, scroll up and check the `start` method.

From the `start` method we see the below code:

```js
 this.discoverComponents((el) => {
      this.initializeElement(el);
    });
```

In short, the callback initializes these elements.

Now, let's jump into `initializeElement` function.

`initializeElement` function:

```js
function (el) {
    new Component(el);
  }
```

It basically instantiates a Component object by passing in the reference to the selected DOM node.

Before we dive into the Component class, let’s take a look at some helper functions.

`walkDepthFirst` function:

```js
function walkDepthFirst(el, callback) {
  callback(el);

  let node = el.firstElementChild;

  while (node) {
    walkDepthFirst(node, callback);
    node = node.nextElementSibling;
  }
}
```

This is a very simple function that traverses the DOM tree depth first. Let's try this out in the browser and see what it prints out when we give `e=>console.log(e)` function as it's callback.

![Walk Depth First Browser Demo](https://github.com/varadan13/z-state/blob/main/assets/walk-depth-first.png)

So, in the above image and by scrolling up to the HTML code, we can see that the `walkDepthFirst` function traverses the DOM tree in a depth-first manner.

Now, let's look at `zEval` function.

`zEval` function:

```js
function zEval(expression, dataContext, additionalHelperVariables = {}) {
  return new Function(
    ["$data", ...Object.keys(additionalHelperVariables)],
    `var result; with($data) { result = ${expression} }; return result`
  )(dataContext, ...Object.values(additionalHelperVariables));
}
```

At a high level, this function evaluates JavaScript expressions represented as strings, which come from the values of custom attributes in the HTML. Scroll up and you’ll see this in action.

Here is a link to MDN documentation about function constructor [Function Constructor Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function)

Let's run this simplified `zEval` function in the browser and see what we get.

simplified `zEval` function:

```js
function zEval(expression) {
  return new Function([], `return ${expression}`
  )();
}
```

![z-eval Browser Demo](https://github.com/varadan13/z-state/blob/main/assets/z-eval.png)

Now let's take a look at two simple functions that allows us to work with the custom attributes.

```js
function isZAttr(attr) {
  const zAttrRE = /z-(on|data|text)/;
  return zAttrRE.test(attr.name);
}

function getZAttrs(el) {
  return Array.from(el.attributes)
    .filter(isZAttr)
    .map((attr) => {
      const typeMatch = attr.name.match(/z-(on|data|text)/);
      const valueMatch = attr.name.match(/:([a-zA-Z\-]+)/);
      const modifiers = attr.name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];

      const res = {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace(".", "")),
        expression: attr.value,
      };

      return res;
    });
}
```

So, what does the `isZAttr` function actually do?

It, basically, checks whether the attributes are the custom attributes we want to work with in this script and they are: `z-on`, `z-data` and `z-text`.

From the implementation of `getZAttrs`, all we need to understand is that it transforms the attributes into a form that we can easily use in the `Component` class.

Now, before, jumping into the `Component` we must understand what is a Proxy.

Here is a link to a tutorial that explains `Proxy` quite well. [Link to Proxy tutorial](https://javascript.info/proxy)

Now, we are ready to jump into the `Component` class.

But before that, using all the knowledge above, we can sum up how reactivity can be achieved.

Within `Component` class we can observe the following things:

1. The child nodes of the DOM node that contains the attribute `z-data` are traversed depth first using `walkDepthFirst` function and will be initialized based on the type of attributes they have. So if they have `z-text`, that nodes innerText attribute will be updated and if the attribute is `z-on` then event listener is registered on the node and we are able to execute them based on the magic that is present within the `zEval` function.
2. The value of `z-data` attribute will be evaluated and wrapped in a proxy.
3. The `Proxy` has a `set trap`, which calls a function (`refresh`) that makes the script re-traverse the node and update its attributes appropriately.

That is it.

So, now here is the code of the `Component` class:

```js
class Component {
  constructor(el) {
    this.el = el;

    const rawData = zEval(this.el.getAttribute("z-data"), {});

    this.data = this.wrapDataInObservable(rawData);

    this.initialize();
  }

  wrapDataInObservable(data) {
    var self = this;

    const proxyHandler = () => {
      return {
        set(obj, property, value) {
          const setWasSuccessful = Reflect.set(obj, property, value);

          self.refresh();

          return setWasSuccessful;
        },
      };
    };

    return new Proxy(data, proxyHandler());
  }

  initialize() {
    walkDepthFirst(this.el, (el) => {
      this.initializeElement(el);
    });
  }

  initializeElement(el) {
    getZAttrs(el).forEach(({ type, value, modifiers, expression }) => {
      switch (type) {
        case "on":
          var event = value;
          this.registerListener(el, event, modifiers, expression);
          break;

        case "text":
          var { output } = this.evaluateReturnExpression(expression);
          this.updateTextValue(el, output);
          break;

        default:
          break;
      }
    });
  }

  refresh() {
    var self = this;

    walkDepthFirst(this.el, function (el) {
      getZAttrs(el).forEach(({ type, value, modifiers, expression }) => {
        switch (type) {
          case "text":
            var { output } = self.evaluateReturnExpression(expression);

            self.updateTextValue(el, output);

            break;

          default:
            break;
        }
      });
    });
  }

  registerListener(el, event, modifiers, expression) {
    const node = el;

    const handler = (e) => {
      this.runListenerHandler(expression, e);
    };

    node.addEventListener(event, handler);
  }

  runListenerHandler(expression, e) {
    this.evaluateCommandExpression(expression);
  }

  evaluateReturnExpression(expression) {
    const result = this.data[expression];

    return {
      output: result,
    };
  }

  evaluateCommandExpression(expression, extraData) {
    zEval(expression, this.data, extraData);
  }

  updateTextValue(el, value) {
    el.innerText = value;
  }
}
```
So that’s it, guys—we’ve managed to build a script that lets us work with HTML just like Alpine.js







