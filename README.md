

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

As you can see, the code is pretty straightforward.
