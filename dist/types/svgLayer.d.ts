import { ResolvedRenderOptions } from './options';
import { RenderModel } from './renderModel';
export declare class SVGLayer {
    svgNode: SVGSVGElement;
    constructor(el: HTMLElement);
}
export declare function makeContentBox(model: RenderModel, options: ResolvedRenderOptions): SVGSVGElement;
