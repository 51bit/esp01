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
