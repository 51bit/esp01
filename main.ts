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

enum ESPMODE {
    STA,
    AP,
    AP_STA
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
    let client_ID: string = "192.168.4.2"
    let LED_status: number = 0x0


    // getResponse
    function get_response(): string {
        let result: boolean = false
        let response: string = ""
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            response += serial.readString()
            if (response.length > 200) {
                response = response.substr(response.length - 200)
            }
        })
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => { })
        return response
    }

    // 
    function wait_for_response(str: string): boolean {
        return get_response().includes(str)
    }

    /**
     * Unicode NewLine chars
     */
    //% weight=92
    //% group="Wifi Common"
    //% blockId="esp01_crlf" block="CRLF"
    export function newline(): string {
        return NEWLINE
    }

    /**
     * Send AT command.
     * @param cmd AT command, eg: "AT"
     * @param sleepTime Sleep time, eg: 1000
     */
    //% weight=91
    //% group="Wifi Common"
    //% blockId="esp01_send_at" block="send AT command %cmd and wait %sleepTime ms"
    export function sendATCommand(cmd: string, sleepTime: number = 1000): void {
        serial.writeString(cmd + NEWLINE)
        if (sleepTime > 0) basic.pause(sleepTime)
    }

    /**
     * Setup ESP-01
     * @param TXPin TXPin, eg: SerialPin.P1
     * @param RXPin RXPin, eg: SerialPin.P2
     */
    //% weight=100
    //% group="Wifi Common"
    //% blockId="esp01_init_uart" block="Setup ESP-01, TXPin:%TXPin , RXPin:%RXPin"
    export function initUART(TXPin: SerialPin = SerialPin.P1, RXPin: SerialPin = SerialPin.P2): void {
        serial.redirect(TXPin, RXPin, BaudRate.BaudRate115200)
    }

    /**
    * Set ESP-01 mode
    * @param mode mode, eg: ESPMODE.STA
    */
    //% weight=100
    //% group="Wifi Common"
    //% blockId="esp01_setMode" block="Set ESP-01 mode: %mode"
    export function setMode(mode: ESPMODE = ESPMODE.STA): void {
        // WIFI mode = Station mode (client) + AP Server:
        sendATCommand("AT+CWMODE=" + (mode + 1), 5000)
        // Restart module:
        sendATCommand("AT+RST", 2000)
    }

    /**
     * Connect to WiFi Router.
     * @param wifiRouter wifi Router, eg: "myHomeWifi"
     * @param password Password, eg: "password"
     */
    //% weight=99
    //% group="Wifi Router Suite"
    //% blockId="esp01_connect_wifi" block="connect to WiFi Router %wifiRouter, %password"
    export function connectToWiFiRouter(wifiRouter: string, password: string): boolean {
        // Connect to AP:
        sendATCommand("AT+CWJAP=\"" + wifiRouter + "\",\"" + password + "\"", 0)
        let result: boolean = wait_for_response("OK")
        //AT+CIFSR//get ip address
        //AT+CIPMUX=0//set single connection
        //AT+CIPMODE=1//enable wifi transfer
        //AT+CIPSTART="TCP","192.168.4.1",8899//connect tcp connection to ap
        //AT+CIPSEND//send command
        //>
        //ABCDEFG//send data
        return result
    }

    /**
     * Disconnect from WiFi Router.
     */
    //% weight=98
    //% group="Wifi Router Suite"
    //% blockId="esp01_disconnect_wifi" block="disconnect from WiFi Router"
    export function disconnectFromWiFiRouter(): void {
        // Disconnect from AP:
        sendATCommand("AT+CWQAP", 6000)
    }

    /**
     * send TCP
     * @param destIP destination IP address, eg: 192.168.4.2
     * @param destPort destination port, eg: 1000
     */
    //% weight=80
    //% group="send"
    //% blockId="esp01_sendTCP" block="send TCP, host: %destIP|destPort: %port"
    //% inlineInputMode=inline
    export function sendTCP(destIP: string, destPort: number): void {
        sendATCommand("AT+CIPSTART=\"TCP\",\"" + destIP + "\"," + destPort + "")
    }

    /**
     * send UDP
     * @param PC_UDPServer_IP destination IP address, eg: 192.168.4.2
     * @param PC_UDPServer_Port PC UDPServer Port, eg: 5000
     * @param destPort destination port, eg: 1000
     */
    //% weight=80
    //% group="send"
    //% blockId="esp01_sendUDP" block="send UDP, PC UDPServer IP: %PC_UDPServer_IP|PC UDPServer Port: %PC_UDPServer_Port|dest Port: %destPort"
    //% inlineInputMode=inline
    export function sendUDP(PC_UDPServer_IP: string, PC_UDPServer_Port: number, destPort: number): void {
        sendATCommand("AT+CIPSTART=\"UDP\",\"+PC_UDPServer_IP+\"," + PC_UDPServer_Port + "," + destPort + ",0")
    }

    /**
     * AP TCP Server
     * @param ssid ssid, eg: ESP8266
     * @param password AP server password, eg: 123456
     */
    //% weight=80
    //% group="AP"
    //% blockId="esp01_AP_TCP" block="AP TCP Server, ssid: %ssid|password: %password"
    //% inlineInputMode=inline
    export function AP_TCP(ssid: string, password: string): void {
        sendATCommand("AT+CWMODE=2")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWSAP=\"" + ssid + "\",\"" + password + "\",11,0")
        sendATCommand("AT+CIPSERVER=1,8899")
        //will send data
        //AT+CIPSEND=0,11
    }

    /**
    * STA TCP Server
    * @param wifiRouter wifi Router, eg: myHomeWifi
    * @param password AP server password, eg: 123456
    */
    //% weight=80
    //% group="STA"
    //% blockId="esp01_STA_TCP" block="STA TCP Server, wifi router: %wifiRouter|password: %password"
    //% inlineInputMode=inline
    export function STA_TCP(wifiRouter: string, password: string): void {
        sendATCommand("AT+CWMODE=1")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWLAP")
        sendATCommand("AT+CWJAP=\"" + wifiRouter + "\",\"" + password + "\"")
        sendATCommand("AT+CIFSR")
        sendATCommand("AT+CIPMUX=1")
        sendATCommand("AT+CIPSERVER=1,8899")
        //will send data
        //AT+CIPSEND=0,11
    }

    /**
     * STA TCP Client
     * @param wifiRouter wifi Router, eg: myHomeWifi
     * @param password AP server password, eg: 123456
     */
    //% weight=80
    //% group="STA"
    //% blockId="esp01_STA_TCPClient" block="STA TCP Client, wifi router: %wifiRouter|password: %password"
    //% inlineInputMode=inline
    export function STA_TCPClient(wifiRouter: string, password: string): void {
        sendATCommand("AT+CWMODE=1")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWLAP")
        sendATCommand("AT+CWJAP=\"" + wifiRouter + "\",\"" + password + "\"")
        sendATCommand("AT+CIFSR")
        sendATCommand("AT+CIPMUX=0")
        sendATCommand("AT+CIPMODE=1")
        ////connect to server
        //sendATCommand("AT+CIPSTART=\"TCP\",\""+destIP+"\","+destPort+"")
        //AT+CIPSTART="TCP","192.168.43.104",8899
        //AT+CIPSEND
        //data
        //+++
    }

    /**
     * STA UDP MultiConnections
     * @param wifiRouter wifi Router, eg: myHomeWifi
     * @param password AP server password, eg: 123456
     */
    //% weight=80
    //% group="AP"
    //% blockId="esp01_STA_UDP_MultiConnections" block="STA UDP Multiple Connections, wifi router: %wifiRouter|password: %password"
    //% inlineInputMode=inline
    export function STA_UDP_MultiConnections(wifiRouter: string, password: string): void {
        sendATCommand("AT+CWMODE=1")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWLAP")
        sendATCommand("AT+CWJAP=\"" + wifiRouter + "\",\"" + password + "\"")
        sendATCommand("AT+CIFSR")
        sendATCommand("AT+CIPMUX=1")
        //sendATCommand("AT+CIPSTART=0,\"UDP\",\"255.255.255.255\","+PC_UDPServer_Port+","+destPort+", 0")
        //AT+CIPSTART=0,"UDP","255.255.255.255",50000,1000, 0
        //will send data
        //AT+CIPSEND=0,11
    }

    /**
     * STA UDP AT
     * @param wifiRouter wifi Router, eg: myHomeWifi
     * @param password AP server password, eg: 123456
     */
    //% weight=80
    //% group="STA"
    //% blockId="esp01_STA_UDP_AT" block="STA UDP AT, wifi router: %wifiRouter|password: %password"
    //% inlineInputMode=inline
    export function STA_UDP_AT(wifiRouter: string, password: string): void {
        sendATCommand("AT+CWMODE=1")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWLAP")
        sendATCommand("AT+CWJAP=\"" + wifiRouter + "\",\"" + password + "\"")
        sendATCommand("AT+CIFSR")
        sendATCommand("AT+CIPMUX=0")
        sendATCommand("AT+CIPMODE=1")
        //sendATCommand("AT+CIPSTART=\"UDP\",\"+PC_UDPServer_IP+\","+PC_UDPServer_Port+","+destPort+",0")
        //AT+CIPSTART="UDP","192.168.43.104",5000,2000,0
        //will send data
        //AT+CIPSEND=0,11
    }

    /**
     * AP UDP For 2 Modules
     * @param ssid ssid, eg: ESP8266
     * @param password AP server password, eg: 123456
     */
    //% weight=80
    //% group="AP"
    //% blockId="esp01_AP_UDP_For2Modules" block="AP UDP for 2 modules, ssid: %ssid|password: %password"
    //% inlineInputMode=inline
    export function AP_UDP_For2Modules(ssid: string, password: string): void {
        sendATCommand("AT+CWMODE=2")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWSAP=\"" + ssid + "\",\"" + password + "\",11,0")
        sendATCommand("AT+CIPMUX=0")
        sendATCommand("AT+CIPMODE=1")
        //wait another module to send, then we can send
        //AT+CIPSTART="UDP","192.168.4.2",333,333,0
        //will send data
        //AT+CIPSEND=0,11
    }

    /**
     * STA UDP For 2 Modules
     * @param ssid ssid, eg: ESP8266
     * @param password AP server password, eg: 123456
     */
    //% weight=80
    //% group="STA"
    //% blockId="esp01_STA_UDP_For2Modules" block="STA UDP for 2 modules, ssid: %ssid|password: %password"
    //% inlineInputMode=inline
    export function STA_UDP_For2Modules(ssid: string, password: string): void {
        sendATCommand("AT+CWMODE=1")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWLAP")
        sendATCommand("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"")
        sendATCommand("AT+CIPMUX=0")
        sendATCommand("AT+CIPMODE=1")
        //AT+CIPSTART="UDP","192.168.4.1",333,333,0
        //will send data
        //AT+CIPSEND
    }

    /**
    * AP TCP For 2 Modules
    * @param ssid ssid, eg: ESP8266
    * @param password AP server password, eg: 123456
    */
    //% weight=80
    //% group="AP"
    //% blockId="esp01_AP_TCP_For2Modules" block="AP TCP for 2 modules, ssid: %ssid|password: %password"
    //% inlineInputMode=inline
    export function AP_TCP_For2Modules(ssid: string, password: string): void {
        sendATCommand("AT+CWMODE=2")

        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWSAP=\"" + ssid + "\",\"" + password + "\",11,0")
        sendATCommand("AT+CIPMUX=1")
        sendATCommand("AT+CIPSERVER=1,8899")
        //will send data
        //AT+CIPSEND=0,11
    }

    /**
     * STA TCP For 2 Modules
     * @param ssid ssid, eg: ESP8266
     * @param password AP server password, eg: 123456
     */
    //% weight=80
    //% group="STA"
    //% blockId="esp01_STA_TCP_For2Modules" block="STA TCP for 2 modules, ssid: %ssid|password: %password"
    //% inlineInputMode=inline
    export function STA_TCP_For2Modules(ssid: string, password: string): void {
        sendATCommand("AT+CWMODE=1")
        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWLAP")
        sendATCommand("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"")
        sendATCommand("AT+CIFSR")
        sendATCommand("AT+CIPMUX=0")
        sendATCommand("AT+CIPMODE=1")
        //sendATCommand("AT+CIPSTART="TCP","192.168.4.1",8899")
        //will send data
        //AT+CIPSEND
    }

    /**
     * STA_AP TCP For Cloud
     * @param wifiRouter wifi Router, eg: ESP8266
     * @param password STA_AP server password, eg: 123456
     */
    //% weight=80
    //% group="Wifi Common"
    //% blockId="esp01_STA_AP_TCP_ForCloud" block="STA_AP TCP for cloud, wifiRouter: %wssid|password: %password"
    //% inlineInputMode=inline
    export function STA_AP_TCP_ForCloud(wifiRouter: string, password: string): void {
        sendATCommand("AT+CWMODE=3")
        // Restart module:
        sendATCommand("AT+RST", 2000)

        sendATCommand("AT+CWLAP")
        sendATCommand("AT+CWJAP=\"" + wifiRouter + "\",\"" + password + "\"")
        sendATCommand("AT+CIPMUX=0")
        sendATCommand("AT+CIPMODE=1")
        //sendATCommand("AT+CIPSTART="TCP","115.29.109.104",6602")
        //will send data
        //AT+CIPSEND
    }

    // generate HTML
    // LED_status=0x23be, 0x23be=0000 0000 0010 0011 1011 1110
    function getHTML(normal: boolean): string {
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
            for (let i = 0; i < 4; ++i) {
                const index = 3 - i;
                const a = LED_status >> index;
                if ((a & 1) == 0) {
                    LED_statusString = "OFF"
                    LED_buttonString = "TURN IT ON"
                }
                else {
                    LED_statusString = "ON"
                    LED_buttonString = "TURN IT OFF"
                }
                html += "<h3>LED" + i + " STATUS: " + LED_statusString + "</h3>"
                html += "<br>"
                // generate buttons
                html += "<input type=\"button\" onClick=\"window.location.href=\'LED" + (i + 1) + "\'\" value=\"" + LED_buttonString + "\">"
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
    //% weight=96
    //% group="Wifi Server Suite"
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
            if (input.runningTime() - time > 30000) {
                getCommand = "TIMEOUT"
                break
            }
        }
        let posLED = getCommand.indexOf("LED")
        if (posLED != -1) {
            let getNum = parseInt(getCommand.substr(3, getCommand.length - posLED - 1)) - 1
            let a = LED_status >> getNum

            if ((a & 1) == 0) {
                LED_status = LED_status | (1 << getNum)
            }
            else {
                LED_status = (LED_status & ~(1 << getNum))
            }
        }
        return getCommand
    }

    /**
     * Serve Web HTML.
     * @param getSuccess getSuccess, eg: true
     */
    //% weight=95
    //% group="Wifi Server Suite"
    //% blockId="esp01_serve_webhtml" block="serve Web HTML, success page: %getSuccess"
    export function serveWebHTML(getSuccess: boolean = true): void {
        // output HTML
        let HTML_str: string = getHTML(getSuccess)
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
    //% weight=94
    //% group="Wifi HTTP Suite"
    //% blockId="esp01_sendhttp" block="execute HTTP method %method|host: %host|port: %port|path: %urlPath|headers: %headers|body: %body"
    //% inlineInputMode=inline
    export function sendHttp(method: HttpMethod, host: string, port: number, urlPath: string, headers?: string, body?: string): void {
        let myMethod: string = myMethods[method]
        // Establish TCP connection:
        let data: string = "AT+CIPSTART=\"TCP\",\"" + host + "\"," + port
        sendATCommand(data, sendSerialTimeout * 6)
        data = myMethod + " " + urlPath + " HTTP/1.1" + NEWLINE
            + "Host: " + host + NEWLINE
        if (headers && headers.length > 0) {
            data += headers + NEWLINE
        }
        if (data && data.length > 0) {
            data += NEWLINE + body + NEWLINE
        }
        data += NEWLINE
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
    //% weight=93
    //% group="Wifi HTTP Suite"
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
