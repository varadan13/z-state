function domReady() {
  return new Promise((resolve) => {
    if (document.readyState == "loading") {
      document.addEventListener("DOMContentLoaded", resolve);
    } else {
      resolve();
    }
  });
}

function walkDepthFirst(el, callback) {
  callback(el);

  let node = el.firstElementChild;

  while (node) {
    walkDepthFirst(node, callback);
    node = node.nextElementSibling;
  }
}

function zEval(expression, dataContext, additionalHelperVariables = {}) {
  return new Function(
    ["$data", ...Object.keys(additionalHelperVariables)],
    `var result; with($data) { result = ${expression} }; return result`
  )(dataContext, ...Object.values(additionalHelperVariables));
}

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

      console.log("getZAttrs attribute values:", res);

      return res;
    });
}

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

if (!window.ZState) {
  window.ZState = ZState;
  window.ZState.start();
}
