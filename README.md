# PooPooDom

Type declarations of dom lib.

## Why and When

You are developing in a non-browser environment, but you need typings of DOM. Perhaps you are using
[puppeteer](https://github.com/puppeteer/puppeteer).

You may consider to use `dom` lib. However, it inserts lots of globals. So dirty!

## Usage

```ts
import type { Document, HTMLElement } from 'poopoodom'  // ✓ good
// import { Document, HTMLElement } from 'poopoodom'    // ✗ bad

function getElementByIdAndCheck<Element extends HTMLElement>(
    document: Document,
    id: string
): Element {
    const element = document.getElementById(id)
    if (element === null) {
        throw new Error(`Element not found: ${id}`)
    }
    return element as Element
}
```

**Always import types only:** This package assumes everything is available at runtime and does not
provide any implementation.

Modern browsers now provide `dom.iterable` API. To use it, import whatever you need from
`poopoodom/iterable`. Note that types from `poopoodom` and `poopoodom/iterable` are irrelevant.

```ts
import type { Document as OldDocument, HTMLElement as OldHTMLElement } from 'poopoodom'
import type { Document, HTMLElement } from 'poopoodom/iterable'

function getWideElementByClassNameInOldBrowser(d: OldDocument, className: string): OldHTMLElement[] {
  const elements = d.querySelectorAll<OldHTMLElement>(`.${className}`)
  const ret: OldHTMLElement[] = []
  for (const element of Array.from(elements)) {
    if (element.offsetWidth > 1000) {
      ret.push(element)
    }
  }
  return ret
}

function getWideElementsByClassNameInModernBrowser(d: Document, className: string): HTMLElement[] {
  const elements = d.querySelectorAll<HTMLElement>(`.${className}`)
  const ret: HTMLElement[] = []
  for (const element of elements) {
    if (element.offsetWidth > 1000) {
      ret.push(element)
    }
  }
  return ret
}
```

## Working with ESLint

Add a [typescript-eslint](https://typescript-eslint.io/) rule to prevent accidentally importing
non-type elements.

```js
// .eslintrc.cjs
module.exports = {
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', {
      paths: [{
        name: 'poopoodom',
        allowTypeImports: true
      }]
    }]
  }
}
```
