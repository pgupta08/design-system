/// <reference types="react" />
import { MultiSliderProps } from "../multiSlider";
export declare type NumberRange = [number, number];
export interface RangeSliderProps extends MultiSliderProps {
    defaultValue?: NumberRange;
    value?: NumberRange;
    onChange?: (value: NumberRange) => void;
    onRelease?: (value: NumberRange) => void;
}
export declare const RangeSlider: (props: RangeSliderProps) => JSX.Element;
export default RangeSlider;
