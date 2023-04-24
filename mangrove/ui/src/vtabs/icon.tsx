import { Component, JSX, splitProps } from "solid-js"
// copied from solid heroicons
interface Props2 extends JSX.SvgSVGAttributes<SVGSVGElement> {
    path: {
        path: () => JSX.Element;
        outline?: boolean;
        mini?: boolean;
    };
}
export const Icon2: Component<Props2> = (props) => {
    const [internal, external] = splitProps(props, ["path"]);

    return (
        <svg
            viewBox="0 0 492 492"
            fill={internal.path.outline ? "none" : "currentColor"}
            stroke={internal.path.outline ? "currentColor" : "none"}
            stroke-width={internal.path.outline ? 1.5 : undefined}
            {...external}
        >
            {internal.path.path()}
        </svg>
    );
};