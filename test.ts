let pass = 0
let httpResult = ""
esp01.setupEsp01(SerialPin.P1, SerialPin.P2)
if (esp01.connectToWiFiRouter("myRouterSSID", "password")) {
    basic.showIcon(IconNames.Yes)
} else {
    basic.showIcon(IconNames.No)
}
esp01.setupAPServer("myAPSSID", "password")
basic.forever(function () {
    httpResult = esp01.getAPWebRequest()
    pass = 0
    if (httpResult == "") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P0, 1)
    } else if (httpResult == "LED1") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P8, 1)
    } else if (httpResult == "LED2") {
        pass = 1
        pins.digitalWritePin(DigitalPin.P16, 1)
    }
    esp01.serveWebHTML(pass == 1, 0)
})
input.onButtonPressed(Button.A, function () {
    basic.showString(esp01.newline())
})
input.onButtonPressed(Button.B, function () {
    esp01.sendATCommand("AT+GMR")
})