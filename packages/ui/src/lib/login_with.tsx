export const LoginWith = () => {
    return <div class="mt-6">

        <div class="grid grid-cols-4 gap-4">
        <div>
                <a href="#" class="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0">
                    <span class="sr-only">Sign in with Twitter</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 131" version="1.0">
  <path fill="none" stroke="#000" stroke-width="5" d="M28.70919 28.62966c3.51558.00009 7.75777.72666 12.72656 2.17969 5.01557 1.45321 8.34369 2.17977 9.98438 2.17969 2.10931.00008 5.55462-.82023 10.335927-2.46094 4.78118-1.64053 8.92961-2.46085 12.44532-2.46094 5.76553.00009 10.89834 1.54697 15.39843 4.64063 2.53115 1.78133 5.03896 4.19539 7.523437 7.24219-3.750097 3.187571-6.492277 6.02353-8.226557 8.50783-3.14072 4.50006-4.71103 9.46881-4.71094 14.90625-.00009 5.95317 1.66397 11.32036 4.99219 16.10156 3.32802 4.78129 7.124887 7.80472 11.390613 9.07031-1.781346 5.76565-4.734466 11.78908-8.859363 18.07032-6.23447 9.42187-12.42196 14.13281-18.5625 14.13281-2.43758 0-5.81258-.77344-10.125-2.32031-4.26569-1.54688-7.875057-2.32031-10.828127-2.32032-2.95318.00001-6.39849.79688-10.33593 2.39063-3.89067 1.64062-7.05473 2.46093-9.49219 2.46094-7.35941-.00001-14.57815-6.23437-21.65625-18.70313C3.63105 89.91878.09199 77.82504.092 65.96562.09199 54.95006 2.7873 45.97351 8.1779402 39.03591 13.61542 32.0985 20.45916 28.62975 28.70919 28.62966M73.006057.92654c.18742.60949.30461 1.14855.35157 1.61719.04679.46886.07023.93761.07031 1.40625-.00008 3.00011-.70321 6.28135-2.10938 9.84375-1.40632 3.5626-3.63288 6.86728-6.67968 9.91406-2.62507 2.57822-5.22663 4.31259-7.804687 5.20312-1.64069.51572-4.12506.91416-7.45313 1.19532.0937-7.12491 1.94526-13.28896 5.55469-18.49219 3.656177-5.20301 9.679617-8.76551 18.070307-10.6875" font-family="Helvetica" font-size="144" font-weight="400" style="text-align:start;line-height:100%" transform="translate(4.851852 4.505291)"/>
</svg>
                </a>
            </div>
            <div>
                <a href="#" class="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0">
                    <span class="sr-only">Sign in with Facebook</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clip-rule="evenodd" />
                    </svg>
                </a>
            </div>

            <div>
                <a href="#" class="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0">
                    <span class="sr-only">Sign in with Twitter</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                </a>
            </div>

            <div>
                <a href="#" class="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0">
                    <span class="sr-only">Sign in with GitHub</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
                    </svg>
                </a>
            </div>
        </div>
    </div>
}