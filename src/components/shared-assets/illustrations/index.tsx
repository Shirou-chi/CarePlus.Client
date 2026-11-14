import type { HTMLAttributes } from "react";
import { CloudIllustration } from "./cloud";

const types = {
    cloud: CloudIllustration,
};

export interface IllustrationProps extends HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
    svgClassName?: string;
    childrenClassName?: string;
}

export const Illustration = (props: IllustrationProps & { type: keyof typeof types }) => {
    const { type } = props;

    const Component = types[type];

    return <Component {...props} />;
};
