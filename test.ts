input.onButtonPressed(Button.A, function () {
    basic.showString(esp01.newline())
})
input.onButtonPressed(Button.B, function () {
    esp01.sendATCommand("AT+GMR")

})
basic.forever(function () {
	
})
