import { Element as PolymerElement } from '/node_modules/@polymer/polymer/polymer-element.js'
import { DomRepeat } from '/node_modules/@polymer/polymer/lib/elements/dom-repeat.js'

/*
 * Show keyframes in a grid
 */
class KeyframeGrid extends PolymerElement {
  static get properties() {
    return {
      keyframes: { type: Object }
    }
  }

  _toArray(object) {
    const array = []

    for (const step in object) {
      array.push({
        step: parseFloat(step),
        value: object[step]
      })
    }

    array.sort((a, b) => a.step - b.step)

    return array
  }

  _toJson(object) {
    return JSON.stringify(object)
  }

  static get template() {
    return `
      <style>
        .items {
          display: flex;
          flex-wrap: wrap;
        }
        .item {
          flex: 0 0 2em;
        }
      </style>

      <div class="items">
        <template is="dom-repeat" items="[[_toArray(keyframes)]]" as="keyframe">
          <div class="item">step: [[keyframe.step]] <br> [[_toJson(keyframe.value)]]</div>
        </template>
      </div>
    `
  }

}

customElements.define('keyframe-grid', KeyframeGrid)
