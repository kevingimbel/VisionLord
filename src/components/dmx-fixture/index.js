import { Element as PolymerElement } from '/node_modules/@polymer/polymer/polymer-element.js'
import ReduxMixin from '../../reduxStore.js'
import { uuid } from '../../../libs/abcq/uuid.js'
import { setChannel, addFixture, removeFixture, setChannels, sendUniverseToUsb, sendUniverseToFivetwelve, setFixtureProperties } from '../../actions/index.js'
import DmxDevice from './DmxDevice.js'
import { DomRepeat } from '/node_modules/@polymer/polymer/lib/elements/dom-repeat.js'
import '../dmx-fixture-property/index.js'
import CameoPixBar600PRO from './dmx/CameoPixBar600PRO.js'
import { colors, batch } from '../../utils/index.js'

/*
 * A single DMX fixture with all properties
 */
class DmxFixture extends ReduxMixin(PolymerElement) {

  ready() {
    super.ready()

    // Dynamically import fixture of a specific type
    import('./dmx/' + this.type + '.js').then((module) => {

      // Create fixture
      const fixture = new module.default({
        address: this.address,
        universe: this.universe
      })

      this.fixture = fixture
   });
  }

  static get properties() {
    return {
      name: { type: String },
      id: { type: String },
      type: { type: String },
      address: { type: Number },
      universe: { type: Number },
      fixture : { type: Object },
      properties: {
        type: Object
      },
      _properties: {
        type: Object,
        computed: 'computeProperties(fixture)'
      },
      fixtures: {
        type: Array,
        statePath: 'fixtureManager'
      },
      live: {
        type: Boolean,
        statePath: 'live'
      },
      editMode: {
        type: Boolean,
        computed: 'computeEditMode(live)'
      },
      modvManager: {
        type: Object,
        statePath: 'modvManager'
      },
      // @TODO: use usbManager.lastTransmission instead
      timelineManagerProgress: {
        type: Object,
        statePath: 'timelineManager.progress',
        observer: 'observeTimelineManager'
      },
    }
  }

  // @TODO: I thought this might fix https://github.com/NERDDISCO/VisionLord/issues/11, but it doesn't
  computeProperties(fixture) {
    return fixture.getParamsList()
  }

  observeTimelineManager() {
    this.changedProperties()
  }

  computeEditMode(live) {
    return !live
  }

  changedProperties() {

    if (this.fixture === undefined) return
    if (this.properties === undefined) return

    // Iterate over all properties
    Object.entries(this.properties).map(([name, value]) => {

      // Property exists for the fixture
      if (typeof this.fixture[name] !== undefined) {

        // Overwrite the color of every fixture when a connection to modV was established
        if (name === 'color' && this.modvManager.connected) {
          value = colors.modv.average
        }

        this.fixture[name] = value

        // @TODO: Remove workaround
        this.updateCameoPixBar600PRO(name, value)
      }
    })
  }

  /*
   * A property gets changed on the fixture using the UI
   */
  handleChange(e) {
    const { name, value } = e.detail
    // Set the property of the fixture which will also set the values on the corresponding channels
    this.fixture[name] = value

    // @TODO: Remove workaround
    this.updateCameoPixBar600PRO(name, value)

    // @TODO: Do I need this here?
    this.dispatch(setFixtureProperties(this.id, { [name]: value }))

    // Send all values of all channels to universe 0
    this.dispatch(setChannels(0, [...batch]))

    // Send the universe to the USB DMX controller
    this.dispatch(sendUniverseToUsb(new Date()))

    // Send the universe to fivetwelve
    this.dispatch(sendUniverseToFivetwelve(new Date()))
  }

  /*
   * This is a hack to update the Cameo PixBar 600 PRO, because it has 12 LEDs
   * and they can be controlled individually
   *
   * @TODO: Use the LEDs individually instead
   */
  updateCameoPixBar600PRO(name, value) {
    if (this.fixture instanceof CameoPixBar600PRO) {
      if (name === 'color') {
        this.fixture.setColor(value)
      } else if (name === 'uv') {
        this.fixture.setUv(value)
      }
    }
  }

  static get template() {
    return `
      <template is="dom-if" if="[[editMode]]">

        <style>
          .grid {
            display: flex;
            flex-direction: row;
          }

          .property {
            margin: 0 .25em;
          }
        </style>

        <div>
          <div class="grid">
            <div class="property" title="[[id]]">Name: [[name]]</div>
            <div class="property">Type: [[type]]</div>
            <div class="property">Weight: [[fixture.weight]] kg</div>
            <div class="property">Channels: [[fixture.channels]]</div>
            <div class="property">Address: [[address]] </div>
            <div class="property">Universe: [[universe]]</div>
          </div>

          <div class="grid">
            <template is="dom-repeat" items="{{_properties}}" as="property">
              <dmx-fixture-property
                on-change="handleChange"

                property="[[property]]"
                name="[[property.name]]"
                type="[[property.type]]"
                channels="[[property.channels]]"

                class="property"></dmx-fixture-property>
            </template>
          </div>

        </div>

      </template>
    `
  }
}

customElements.define('dmx-fixture', DmxFixture)
