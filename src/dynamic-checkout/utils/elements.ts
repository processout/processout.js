/// <reference path="../references.ts" />

module ProcessOut {
  type ElementOptions = {
    tagName: string
    textContent?: string
    innerHTML?: string
    classNames?: string[]
    attributes?: Record<string, string>
  }

  export class HTMLElements {
    static createElement({
      tagName,
      classNames,
      textContent,
      attributes,
      innerHTML,
    }: ElementOptions): HTMLElement {
      const element = document.createElement(tagName)

      if (classNames) {
        classNames.forEach(className => element.classList.add(className))
      }

      if (attributes) {
        Object.keys(attributes).forEach(key => {
          element.setAttribute(key, attributes[key])
        })
      }

      if (textContent) {
        element.textContent = textContent
      }

      if (innerHTML) {
        element.innerHTML = innerHTML
      }

      return element
    }

    static createMultipleElements(elements: ElementOptions[]) {
      return elements.map(element => this.createElement(element))
    }

    static appendChildren(parent: HTMLElement, children: HTMLElement[]) {
      children.forEach(child => parent.append(child))
      return parent
    }

    static replaceChildren(parent: HTMLElement, children: HTMLElement[]) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
      }

      this.appendChildren(parent, children)
    }
  }
}
