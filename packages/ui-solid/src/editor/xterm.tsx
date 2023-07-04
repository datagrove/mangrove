import { createEffect } from "solid-js";
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css'


function prep(term: Terminal, socket: WebSocket) {
    let command = ""
    term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
    let prompt = () => {
        command = '';
        term.write('\r\n$ ');
    }
    prompt()

    const clearInput = (command: string) => {
        var inputLengh = command.length;
        for (var i = 0; i < inputLengh; i++) {
            term.write('\b \b');
        }
    }
    socket.onmessage = (event) => {
        term.write(event.data);
    }

    function runCommand() {
        if (command.length > 0) {
            clearInput(command);
            socket.send(command + '\n');
            return;
        }
    }

    term.onData(e => {
        switch (e) {
            case '\u0003': // Ctrl+C
                term.write('^C');
                prompt();
                break;
            case '\r': // Enter
                runCommand();
                command = '';
                break;
            case '\u007F': // Backspace (DEL)
            // Do not delete the prompt
            // if (term._core.buffer.x > 2) {
            //     term.write('\b \b');
            //     if (command.length > 0) {
            //         command = command.substr(0, command.length - 1);
            //     }
            // }
            default:
                if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                    command += e;
                    term.write(e);
                }
        }
    })
}
export function Xterminal() {
    let el: HTMLDivElement
    createEffect(() => {
        const term = new Terminal();
        term.open(el!)
    })


    return <div ref={el!} class='h-full w-full' />
}






