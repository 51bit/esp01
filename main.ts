enum HttpMethod {
    GET,
    POST,
    PUT,
    HEAD,
    DELETE,
    PATCH,
    OPTIONS,
    CONNECT,
    TRACE
}

/**
 * esp-01 tool
 */
//% weight=6 color=#2699BF icon="\uf110" block="esp-01 tool"
namespace esp01 {
    let NEWLINE: string = "\u000D\u000A"
    let myMethods: string[] = ["GET", "POST", "PUT", "HEAD", "DELETE", "PATCH", "OPTIONS", "CONNECT", "TRACE"]
    let sendSerialTimeout: number = 1000
    let serial_str: string = ""
    let client_ID: string = ""

    // for wifi connection
    function wait_for_response(str: string): boolean {
        let result: boolean = false
        let time: number = input.runningTime()
        while (true) {
            serial_str += serial.readString()
            if (serial_str.length > 200) {
                serial_str = serial_str.substr(serial_str.length - 200)
            }
            if (serial_str.includes(str)) {
                result = true
                break
            }
            if (input.runningTime() - time > 300000) break
        }
        return result
    }

    /**
     * Unicode NewLine chars
     */
    //% weight=93
    //% group="Common"
    //% blockId="esp01_crlf" block="CRLF"
    export function newline(): string {
        return NEWLINE
    }

    /**
     * Send AT command.
     * @param cmd AT command, eg: "AT"
     * @param sleepTime Sleep time, eg: 1000
     */
    //% weight=97
    //% group="Common"
    //% blockId="esp01_send_at" block="send AT command %cmd and wait %sleepTime ms"
    export function sendATCommand(cmd: string, sleepTime: number = 1000): void {
        serial.writeString(cmd + NEWLINE)
        if (sleepTime > 0) basic.pause(sleepTime)
    }

    /**
     * Setup ESP-01
     */
    //% weight=100
    //% group="Wifi suite"
    //% blockId="esp01_connect" block="Setup ESP-01, TXPin:%TXPin , RXPin:%RXPin"
    export function setupEsp01(TXPin: SerialPin = SerialPin.P0, RXPin: SerialPin = SerialPin.P1): void {
        serial.redirect(TXPin, RXPin, BaudRate.BaudRate115200)
        basic.pause(100)
        // Restart module:
        sendATCommand("AT+RST", 2000)
        // WIFI mode = Station mode (client) + AP Server:
        sendATCommand("AT+CWMODE=3", 5000)
    }

    /**
     * Connect to WiFi Router.
     * @param ssid SSID, eg: "SSID"
     * @param password Password, eg: "password"
     */
    //% weight=99
    //% group="Wifi suite"
    //% blockId="esp01_connect_wifi" block="connect to WiFi Router %ssid, %password"
    export function connectToWiFiRouter(ssid: string, password: string): boolean {
        // Connect to AP:
        sendATCommand("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"", 6000)
        let result: boolean = wait_for_response("OK")
        if (!result) control.reset()
        return result
    }

    /**
     * Disconnect from WiFi Router.
     */
    //% weight=98
    //% group="Wifi suite"
    //% blockId="esp01_disconnect_wifi" block="disconnect from WiFi Router"
    export function disconnectFromWiFiRouter(): void {
        // Disconnect from AP:
        sendATCommand("AT+CWQAP", 6000)
    }

    /**
     * Connect to AP Server.
     * @param ssid SSID, eg: "SSID"
     * @param password Password, eg: "password"
     */
    //% weight=99
    //% group="Wifi Server suite"
    //% blockId="esp01_setup_apserver" block="setup AP Server %ssid, %password"
    export function setupAPServer(ssid: string, password: string): void {
        // setup AP with 4 channels and authenticate mode = 4 (WPA_WPA2_PSK)
        sendATCommand("AT+CWSAP=\"" + ssid + "\",\"" + password + "\",1,4", 6000)
        // allow multiple connections
        sendATCommand("AT+CIPMUX=1")
        //start web server
        sendATCommand("AT+CIPSERVER=1,80")
        // display IP (you'll need this in STA mode; in AP mode it would be default 192.168.4.1)
        //sendATCommand("AT+CIFSR")
    }

    // generate HTML
    // LED_status=0x23be, 0x23be=0000 0000 0010 0011 1011 1110
    function getHTML(normal: boolean, LED_status: number): string {
        let LED_statusString: string = ""
        let LED_buttonString: string = ""
        let web_title: string = "ESP8266 (ESP-01) Wifi on BBC micro:bit"
        let html: string = ""
        html += "HTTP/1.1 200 OK\r\n" // HTTP response
        html += "Content-Type: text/html\r\n"
        html += "Connection: close\r\n\r\n"
        html += "<!DOCTYPE html>"
        html += "<html>"
        html += "<head>"
        html += "<link rel=\"icon\" href=\"data:,\">"
        html += "<title>" + web_title + "</title>"
        html += "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        html += "</head>"
        html += "<body>"
        html += "<div style=\"text-align:center\">"
        html += "<h1>" + web_title + "</h1>"
        html += "<br>"
        // generate status text
        if (normal) {
            for (let i = 0; i < 16; ++i) {
                const index=15-i;
                const a=LED_status >> index;
                if((a & 1)==0)
                {
                    LED_statusString = "OFF"
                    LED_buttonString = "TURN IT ON"
                }
                else
                {
                    LED_statusString = "ON"
                    LED_buttonString = "TURN IT OFF"
                }
                html += "<h3>LED"+i+" STATUS: " + LED_statusString + "</h3>"
                html += "<br>"
                // generate buttons
                html += "<input type=\"button\" onClick=\"window.location.href=\'LED"+(i+1)+"\'\" value=\"" + LED_buttonString + "\">"
                html += "<br>"
            }
        } else {
            html += "<h3>ERROR: REQUEST NOT FOUND</h3>"
        }
        html += "<br>"
        html += "<input type=\"button\" onClick=\"window.location.href=\'/'\" value=\"Home\">"
        html += "</div>"
        html += "</body>"
        html += "</html>"
        return html
    }

    /**
     * Get AP Web Request.
     */
    //% weight=99
    //% group="Wifi Server suite"
    //% blockId="esp01_get_webrequest" block="get AP web request"
    export function getAPWebRequest(): string {
        let time: number = input.runningTime()
        let getCommand: string = ""
        while (true) {
            // read and store 200 characters from serial port
            serial_str += serial.readString()
            if (serial_str.length > 200) {
                serial_str = serial_str.substr(serial_str.length - 200)
            }
            if (serial_str.includes("+IPD") && serial_str.includes("HTTP")) {
                // got a HTTP request
                client_ID = serial_str.substr(serial_str.indexOf("IPD") + 4, 1)
                let GET_pos: number = serial_str.indexOf("GET")
                let HTTP_pos: number = serial_str.indexOf("HTTP")
                getCommand = serial_str.substr(GET_pos + 5, (HTTP_pos - 1) - (GET_pos + 5))
                break;
            }
            if (input.runningTime() - time > 300000) {
                getCommand = "TIMEOUT"
                break
            }
        }
        return getCommand
    }

    /**
     * Serve Web HTML.
     * @param getSuccess getSuccess, eg: "false"
     * @param LED_status LED_status, eg: "0x23be"
     */
    //% weight=99
    //% group="Wifi Server suite"
    //% blockId="esp01_serve_webhtml" block="serve Web HTML %getSuccess, set LED status: %LED_status"
    export function serveWebHTML(getSuccess: boolean = false, LED_status: number): void {
        // output HTML
        let HTML_str: string = ""
        if (getSuccess) {
            HTML_str = getHTML(true,LED_status) // normal HTML
        } else {
            HTML_str = getHTML(false,LED_status) // HTML with error message
        }
        // send HTML to user
        sendATCommand("AT+CIPSEND=" + client_ID + "," + (HTML_str.length + 2))
        sendATCommand(HTML_str, 1000)
        // close connection
        sendATCommand("AT+CIPCLOSE=" + client_ID)
    }

    /**
     * Send HTTP method.
     * @param method HTTP method, eg: HttpMethod.GET
     * @param host Host, eg: "www.baidu.com"
     * @param port Port, eg: 80
     * @param urlPath Path, eg: "/s?wd=something"
     * @param headers Headers
     * @param body Body
     */
    //% weight=96
    //% group="HTTP suite"
    //% blockId="esp01_sendhttp" block="execute HTTP method %method|host: %host|port: %port|path: %urlPath||headers: %headers|body: %body"
    //% inlineInputMode=inline
    export function sendHttp(method: HttpMethod, host: string, port: number, urlPath: string, headers?: string, body?: string): void {
        let myMethod: string = myMethods[method]
        // Establish TCP connection:
        let data: string = "AT+CIPSTART=\"TCP\",\"" + host + "\"," + port
        sendATCommand(data, sendSerialTimeout * 6)
        data = myMethod + " " + urlPath + " HTTP/1.1" + "\u000D" + "\u000A"
            + "Host: " + host + "\u000D" + "\u000A"
        if (headers && headers.length > 0) {
            data += headers + "\u000D" + "\u000A"
        }
        if (data && data.length > 0) {
            data += "\u000D" + "\u000A" + body + "\u000D" + "\u000A"
        }
        data += "\u000D" + "\u000A"
        // Send data:
        sendATCommand("AT+CIPSEND=" + (data.length + 2), sendSerialTimeout * 3)
        sendATCommand(data, sendSerialTimeout * 6)
        // Close TCP connection:
        sendATCommand("AT+CIPCLOSE", sendSerialTimeout * 3)
    }

    /**
     * Send HTTP method and response.
     * @param method HTTP method, eg: HttpMethod.GET
     * @param host Host, eg: "www.baidu.com"
     * @param port Port, eg: 80
     * @param urlPath Path, eg: "/s?wd=something"
     * @param headers Headers
     * @param body Body
     */
    //% weight=94
    //% group="HTTP suite"
    //% blockId="esp_sendhttp_response" block="Send HTTP method %method|host: %host|port: %port|path: %urlPath|headers: %headers|body: %body"
    //% inlineInputMode=inline
    export function sendHttpAndResponse(method: HttpMethod, host: string, port: number, urlPath: string, headers?: string, body?: string): string {
        let response: string
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            response += serial.readString()
        })
        sendHttp(method, host, port, urlPath, headers, body)
        let value: string = response.substr(response.indexOf("[") + 2, response.indexOf("]") - response.indexOf("[") - 3)
        response = null
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => { })
        return value
    }
}

