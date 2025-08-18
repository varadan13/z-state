
function domReady() {
    return new Promise(resolve => {
        if (document.readyState == "loading") {
            document.addEventListener("DOMContentLoaded", resolve)
        } else {
            resolve()
        }
    })
}



function walkSkippingNestedComponents(el, callback, isRoot = true) {
    if (el.hasAttribute('x-data') && !isRoot) return

    callback(el)

    let node = el.firstElementChild

    while (node) {
        walkSkippingNestedComponents(node, callback, false)

        node = node.nextElementSibling
    }
}




function saferEval(expression, dataContext, additionalHelperVariables = {}) {

    

    return (new Function(['$data', ...Object.keys(additionalHelperVariables)], `var result; with($data) { result = ${expression} }; return result`))(
        dataContext,...Object.values(additionalHelperVariables)
    ) 
}


function isXAttr(attr) {
    const xAttrRE = /x-(on|bind|data|text|model|if|show|cloak|ref)/

    return xAttrRE.test(attr.name)
}

function getXAttrs(el, type) {
    return Array.from(el.attributes)
        .filter(isXAttr)
        .map(attr => {
            const typeMatch = attr.name.match(/x-(on|bind|data|text|model|if|show|cloak|ref)/)
            const valueMatch = attr.name.match(/:([a-zA-Z\-]+)/)
            const modifiers = attr.name.match(/\.[^.\]]+(?=[^\]]*$)/g) || []

            return {
                type: typeMatch ? typeMatch[1] : null,
                value: valueMatch ? valueMatch[1] : null,
                modifiers: modifiers.map(i => i.replace('.', '')),
                expression: attr.value,
            }
        })
       
}

class Component {
    constructor(el) {
        this.el = el


        const t = this.el.getAttribute('x-data')

        const rawData = saferEval(this.el.getAttribute('x-data'), {})

        
        


        this.data = this.wrapDataInObservable(rawData)





        this.initialize()


    }

    wrapDataInObservable(data) {


        var self = this

        const proxyHandler = () => {
            return ({
                set(obj, property, value) {

                    const setWasSuccessful = Reflect.set(obj, property, value)


                    self.refresh()

                    return setWasSuccessful
                },
            })
        }



        return new Proxy(data, proxyHandler())
    }

    initialize() {



        walkSkippingNestedComponents(this.el, el => {
            this.initializeElement(el)
        })
    }

    initializeElement(el) {
        const t = getXAttrs(el)

        getXAttrs(el).forEach(({ type, value, modifiers, expression }) => {
            switch (type) {
                case 'on':
                    var event = value
                    this.registerListener(el, event, modifiers, expression)
                    break;



                case 'text':
                    var { output } = this.evaluateReturnExpression(expression)
                    this.updateTextValue(el, output)
                    break;


                default:

                    break;
            }
        })
    }


    refresh() {



        var self = this

        walkSkippingNestedComponents(this.el, function (el) {
            getXAttrs(el).forEach(({ type, value, modifiers, expression }) => {
                switch (type) {

                    case 'text':
                        var { output } = self.evaluateReturnExpression(expression)

                        self.updateTextValue(el, output)

                        
                        break;



                    default:
                        break;
                }
            })

        })

    }



    registerListener(el, event, modifiers, expression) {

        const node =el



        const handler = e => {

            this.runListenerHandler(expression, e)

        }

        node.addEventListener(event, handler)
}

    runListenerHandler(expression, e) {
        
        this.evaluateCommandExpression(expression)
    }

    evaluateReturnExpression(expression) {
        const result = this.data[expression]



        return {
            output: result,

        }
    }

    evaluateCommandExpression(expression, extraData) {

        saferEval(expression, this.data, extraData)
    }

    updateTextValue(el, value) {

        el.innerText = value
    }



}


const Alpine = {
    start: async function () {
        await domReady()

        this.discoverComponents(el => {
            this.initializeElement(el)
        })

    },

    discoverComponents: function (callback) {
        const rootEls = document.querySelectorAll('[x-data]');



        rootEls.forEach(rootEl => {

            callback(rootEl)
        })
    },

    initializeElement: function (el) {

        el.__x = new Component(el)
    }
}

if (!window.Alpine ) {
    window.Alpine = Alpine
    window.Alpine.start()
}

