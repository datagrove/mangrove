import { createSignal } from 'solid-js';
import { classList } from 'solid-js/web';
import { Icon } from 'solid-heroicons';
import {  link } from "solid-heroicons/solid";

const BubbleMenu = () => {
    const [isActive, setIsActive] = createSignal(false);

    const toggleMenu = () => {
        setIsActive(!isActive());
    };

    const cl = 'flex items-center justify-center w-10 h-10 rounded-full bg-gray-500 text-white' + isActive() ? ' bg-gray-600' : ''

    return (
        <div class="relative inline-block">
            <button
                onClick={toggleMenu}
                class={cl}

            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isActive() && (
                <div class="absolute z-10 flex flex-col mt-2 space-y-2 bg-white rounded shadow-md">
                    <button class="flex items-center px-4 py-2">
                        <div>B</div>
                    </button>
                    <button class="flex items-center px-4 py-2">
                        <div>I</div>
                    </button>
                    <button class="flex items-center px-4 py-2">
                        <div>U</div>
                    </button>
                    <button class="flex items-center px-4 py-2">
                        <Icon path={link} class="w-5 h-5 mr-2" />
                        Link
                    </button>
                </div>
            )}
        </div>
    );
};

export default BubbleMenu;
