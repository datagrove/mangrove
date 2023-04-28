import { Component, ParentComponent, Show } from 'solid-js';

// this can probably be a normal dropdown?
export const Select: ParentComponent<{
	entries: object
	value: string
	onchange: (e: string) => void
}> = (props) => {

	return (<div class='flex text-black dark:text-white p-2 mr-2 rounded-md items-center space-x-2'>
		<label for='ln'>{props.children}</label> 
		<select
			id='ln'
			value={props.value}
			aria-label="Select language"
			class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
			oninput={(e) => {
				const newLang = e.currentTarget.value
				props.onchange(newLang)
			}}
		>
			{Object.entries(props.entries).map(([code, name]) => (
				<option value={code}>
					{name}&nbsp;&nbsp;&nbsp;
				</option>
			))}
		</select>
	</div>
	);
};

/*
	// class="language-select-wrapper"
			class="header-button language-select"
					produce((e) => {
						e.lang = newLang
					}))*/
				// const [_leadingSlash, _oldLang, ...rest] = window.location.pathname.split('/');
				// const slug = rest.join('/');
				// window.location.pathname = `/${newLang}/${slug}`;