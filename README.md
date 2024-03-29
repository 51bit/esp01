# ESP-01 for micro:bit (in progress, not ready yet.)

ESP-01 makecode extension for micro:bit (in progress, not ready yet.)

![Alt text](https://github.com/51bit/esp01/raw/master/icon.png?raw=true "ESP-01")

Pre-design PCB:
![Alt text](https://github.com/51bit/esp01/raw/master/version0.1.jpg?raw=true "ESP-01 for micro:bit")

## Basic Usage

```blocks
let pass = 0
let httpResult = ""
esp01.initUART(SerialPin.P1, SerialPin.P2)
if (esp01.connectToWiFiRouter("myRouterSSID", "password")) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
}
esp01.AP_TCP("myAPSSID", "password")
while(true)
{
    httpResult = esp01.getAPWebRequest()
    pass = 0
    if (httpResult == "") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P0, 1 - pins.digitalReadPin(DigitalPin.P0))
    } else if (httpResult == "LED1") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P8, 1 - pins.digitalReadPin(DigitalPin.P8))
    } else if (httpResult == "LED2") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P16, 1 - pins.digitalReadPin(DigitalPin.P16))
    } else if (httpResult == "LED3") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P10, 1 - pins.digitalReadPin(DigitalPin.P10))
    } else if (httpResult == "LED4") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P12, 1 - pins.digitalReadPin(DigitalPin.P12))
    }
    if(httpResult != "TIMEOUT")
    {
        esp01.serveWebHTML(pass == 1)
    }
}
input.onButtonPressed(Button.A, function () {
    basic.showString(esp01.newline())
})
input.onButtonPressed(Button.B, function () {
    esp01.sendATCommand("AT+GMR")
})
```
Use ``||newline||`` to generate CRLF chars.

Use ``||sendATCommand||`` to send AT command.

Use ``||setupEsp01||`` to setup ESP-01.

Use ``||connectToWiFiRouter||`` to connect to wifi router.

Use ``||disconnectFromWiFiRouter||`` to disconnect wifi router.

Use ``||setupAPServer||`` to setup AP Web Server.

Use ``||getAPWebRequest||`` to get AP Web Server request.

Use ``||serveWebHTML||`` to serve Web HTML page.

Use ``||sendHttp||`` to execute http request.

Use ``||sendHttpAndResponse||`` to send http request and get response.

## Demo

![Alt text](https://github.com/51bit/esp01/raw/master/esp01.png?raw=true "ESP-01 makecode program screenshot")

## Supported targets

* for PXT/microbit

## License

MIT
