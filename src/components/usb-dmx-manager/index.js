import { Element as PolymerElement } from '/node_modules/@polymer/polymer/polymer-element.js'
import ReduxMixin from '../../reduxStore.js'
import USBPort from './USBPort.js'
import ArduinoLeonardoETHDriver from './ArduinoLeonardoETHDriver.js'
import { connectUsb } from '../../actions/index.js'

/*
 * Handle the connection to a USB DMX controller using WebUSB
 * Tested with Arduino Leonardo ETH, but should be compatible with every Arduino
 * that can be used as a USB device
 */
class UsbDmxManager extends ReduxMixin(PolymerElement) {

  constructor() {
    super()

    // USBPort
    this.port = null

    // @TODO: Move ALL OF THIS into it's own module
    this.driver = new ArduinoLeonardoETHDriver(this.port, {})

    // Only request the port for specific devices
    this.usbDeviceFilter = [
      // Arduino LLC (9025)
      { vendorId: 0x2341, productId: 0x8036 },
      // Arduino LLC (9025)
      { vendorId: 0x2341, productId: 0x8037 },
      // Arduino LLC (10755), Leonardo ETH (32832)
      { vendorId: 0x2a03, productId: 0x8040 }
    ]

    // Check for USB devices that are already paired
    this.getUsbPorts().then(list => {
      if (list[0] !== undefined && list[0].hasOwnProperty('device')) {
        [this.port] = list

        // Auto connect
        this.connect()
      }
    })
  }

  static get properties() {
    return {
      usbConnection: {
        type: Boolean,
        statePath: 'connectionManager.usb'
      },
      universes: {
        type: Array,
        statePath: 'universeManager'
      },
      // This is changing every time someone wants to send the universe to the USB DMX controller
      lastTransmission: {
        type: Object,
        statePath: 'usbManager.lastTransmission',
        observer: 'observeLastTransmission'
      }
    }
  }

  observeLastTransmission() {
    // Send universe 0 to the USB DMX controller
    this.driver.send(this.universes[0].channels)
  }

  handleConnectButtonClick() {

    // Disconnect from USB controller
    if (this.usbConnection.connected) {
      this.port.disconnect().then(() => {
        // Disconnected
      }, error => {
        console.error(error)
      })

    // Pair with USB controller
    } else {
      this.enable()
    }
  }

  /*
   * Get a list of USB devices that are already paired
   */
  getUsbPorts() {
    return navigator.usb.getDevices().
      then(devices => {
        this.devices = devices

        return devices.map(device => new USBPort({ device }))
      })
  }

  /*
   * Get access to USB devices that match the provided filters
   */
  requestUsbPort() {
    // Request access to the USB device
    return navigator.usb.requestDevice({ filters: this.usbDeviceFilter }).
      then(device => new USBPort({ device }))
  }

  /*
   * Enable WebUSB and request a USBPort
   */
  enable() {
    this.requestUsbPort().then(selectedPort => {
      this.port = selectedPort
      this.connect()
    }).
    catch(error => {
      console.error(error)
    })
  }

  /*
   * Connect to a selected USBPort
   */
  connect() {

    this.driver.serialport = this.port

    this.port.connect().then(() => {

      // USB is connected
      this.dispatch(connectUsb(true))

      // Receive data
      this.port.onReceive = data => {
        // const textDecoder = new TextDecoder()
        // console.log(textDecoder.decode(data))
      }

      // Receive error
      this.port.onReceiveError = error => {
        // USB is disconnected
        this.dispatch(connectUsb(false))
        console.log(error)
      }

    }, error => {
      // USB is disconnected
      this.dispatch(connectUsb(false))
      console.error(error)
    })
  }

  static get template() {
    return `
      <connect-button type="usb" label="USB" on-click="handleConnectButtonClick"></connect-button>
    `
  }
}

customElements.define('usb-dmx-manager', UsbDmxManager)
